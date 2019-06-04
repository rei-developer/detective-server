const Router = require('koa-router')
const request = require('request')
const qs = require('querystring')
const DB = require('../DB')
const router = new Router()

const inn_client_id = '403199035553-ptrj3m550enl3jdskim8i5be8maua98f.apps.googleusercontent.com'
const inn_client_secret = 'xsAkSHcdp0CuTnYnnor9vP5f'
const inn_redirect_url = 'https://sandspoon.com/androidpublisher/exchange_token'

let recentlyToken = ''

async function createBilling({ userId, transactionId, productId, token, date }) {
  try {
    await DB.query('INSERT INTO billings (userId, transactionId, productId, purchaseToken, purchaseDate) VALUES (?, ?, ?, ?, STR_TO_DATE(?, "%m/%d/%Y %H:%i:%s"))', [userId, transactionId, productId, token, date])
  } catch (e) {
    throw e
  }
}

async function cashUser({ userId, productId }) {
  let value = 0
  switch (productId) {
    case 'coin1000':
      value = 1000
      break
    case 'coin5000':
      value = 5000
      break
  }
  try {
    await DB.query('UPDATE users SET cash = cash + ? WHERE id = ?', [value, userId])
  } catch (e) {
    console.log(e)
    throw e
  }
}

router.get('/androidpublisher/get_code', ctx => {
  const url = 'https://accounts.google.com/o/oauth2/v2/auth'
  const scope = 'https://www.googleapis.com/auth/androidpublisher'
  const codeUrl = url
    + `?scope=${qs.escape(scope)}`
    + `&access_type=offline`
    + `&redirect_uri=${qs.escape(inn_redirect_url)}`
    + `&response_type=code`
    + `&client_id=${inn_client_id}`
  ctx.redirect(codeUrl)
})

router.get('/androidpublisher/exchange_token', async ctx => {
  const form = {
    grant_type: 'authorization_code',
    code: ctx.query.code,
    client_id: inn_client_id,
    client_secret: inn_client_secret,
    redirect_uri: inn_redirect_url
  }
  try {
    const result = await new Promise((resolve, reject) => {
      request.post('https://www.googleapis.com/oauth2/v4/token', { form }, (err, response, body) => {
        if (err)
          return ctx.body = { message: err, status: 'FAILED' }
        const parsed_body = JSON.parse(body)
        recentlyToken = parsed_body.access_token
        resolve({ recentlyToken, status: 'SUCCESS' })
      })
    })
    ctx.body = result
  } catch (e) {
    console.log(e)
    ctx.body = e
  }
})

router.get('/androidpublisher/validate_purchase', async ctx => {
  const packageName = 'com.sandspoons.detective'
  const {
    userId,
    transactionId,
    productId,
    token,
    date
  } = ctx.query
  const url = `https://www.googleapis.com/androidpublisher/v3/applications/${packageName}/purchases/products/${productId}/tokens/${token}`
  const reqUrl = `${url}?access_token=${recentlyToken}`
  try {
    const result = await new Promise((resolve, reject) => {
      request.get(reqUrl, async (err, response, body) => {
        if (err)
          return ctx.body = { message: err, status: 'FAILED' }
        const data = JSON.parse(body)
        if (!data.orderId || data.orderId !== transactionId || data.purchaseState > 0)
          return ctx.body = { message: '유효하지 않은 영수증입니다.', status: 'FAILED' }
        await createBilling({ userId, transactionId, productId, token, date })
        await cashUser({ userId, productId })
        resolve({ status: 'SUCCESS' })
      })
    })
    ctx.body = result
  } catch (e) {
    console.log(e)
    ctx.body = e
  }
})

module.exports = router