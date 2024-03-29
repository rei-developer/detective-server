const DB = require('./DB')
const GameMap = require('./GameMap')

const MAP_COUNT = 257

module.exports = (function () {
  const _static = {
    rank: new Proxy({}, {
      get: function (target, name) {
        return target.hasOwnProperty(name) ? target[name] : { rank: 0, level: 0 }
      }
    }),
    rankKeys: []
  }

  return class Data {
    static async loadData() {
      await Data.loadMaps()
      await Data.loadItems()
      await Data.loadClans()
      await Data.loadRanks()
    }

    static async loadMaps() {
      console.log('맵 로딩중...')
      for (let i = 1; i <= MAP_COUNT; ++i) {
        const map = await GameMap.load(i)
        GameMap.add(map)
      }
      console.log('맵 로딩 완료.')
    }

    static async loadItems() {
      console.log('아이템 로딩중...')
      const items = require(`../Assets/Items.json`)['items']
      for (let i = 0; i < items.length; ++i) {
        const itemData = items[i]
        const item = new Item(itemData.id, itemData.type, itemData.num, itemData.maxNum, itemData.icon, itemData.name, itemData.description, itemData.jobs, itemData.killer, itemData.use, itemData.method)
        Item.items[i + 1] = item
      }
      console.log('아이템 로딩 완료.')
    }

    static async loadClans() {
      console.log('클랜 로딩중...')
      const clans = await DB.LoadClans()
      for (let i = 0; i < clans.length; ++i) {
        const clanData = clans[i]
        const clan = new Clan(clanData.id, clanData.master_id, clanData.name, clanData.level, clanData.exp, clanData.coin, new Date(clanData.regdate))
        const clanmembers = await DB.GetClanMembers(clan.id)
        for (let j = 0; j < clanmembers.length; ++j)
          clan.members.push(clanmembers[j].user_id)
        Clan.clans[clan.id] = clan
      }
      console.log('클랜 로딩 완료.')
    }

    static async loadRanks() {
      console.log('랭킹 로딩중...')
      let users = await DB.LoadRanks()
      let rankNum = 0
      for (const user of users) {
        if (user.admin == 0)
          Data.rankKeys.push(user.name)
        Data.rank[user.name] = { rank: user.admin > 0 ? 0 : ++rankNum, level: user.level }
      }
      console.log('랭킹 로딩 완료.')
    }

    static get rank() {
      return _static.rank
    }

    static get rankKeys() {
      return _static.rankKeys
    }
  }
})()