const mysql = require('promise-mysql')
const config = require('./config')

const pool = mysql.createPool({
  host: 'localhost',
  port: 3306,
  user: 'root',
  password: config.SECRET,
  database: 'detective',
  connectionLimit: 100
})

module.exports = {
  async query(...args) {
    const conn = await pool.getConnection()
    try {
      return await conn.query(...args)
    } catch (e) {
      throw e
    } finally {
      conn.release()
    }
  },
  async LoadPortals(id) {
    try {
      return await this.query('SELECT * FROM portals WHERE place = ?', [id])
    } catch (e) {
      console.error(e)
    }
  },
  async LoadClans() {
    try {
      return await this.query('SELECT * FROM clans')
    } catch (e) {
      console.error(e)
    }
  },
  async LoadRanks() {
    try {
      return await this.query('SELECT name, level, exp, admin FROM users WHERE verify = 1 ORDER BY level DESC, exp DESC')
    } catch (e) {
      console.error(e)
    }
  },
  async FindUserById(id) {
    try {
      const [row] = await this.query('SELECT * FROM users WHERE id = ?', [id])
      return row
    } catch (e) {
      console.error(e)
    }
  },
  async FindUserByOauth(uid, loginType) {
    try {
      const [row] = await this.query('SELECT * FROM users WHERE uid = ? AND login_type = ?', [uid, loginType])
      return row
    } catch (e) {
      console.error(e)
    }
  },
  async FindUserByName(name) {
    try {
      const [row] = await this.query('SELECT * FROM users WHERE name = ?', [name])
      return row
    } catch (e) {
      console.error(e)
    }
  },
  async UpdateUser(user) {
    try {
      await this.query('UPDATE users SET `uuid` = ?, `level` = ?, `exp` = ?, `coin` = ?, `likes` = ?, `escape` = ?, `kill` = ?, `death` = ?, `assist` = ?, `blast` = ?, `rescue` = ?, `rescue_combo` = ?, `survive` = ?, `graphics` = ?, `memo` = ?, `last_chat` = ? WHERE `id` = ?', [
        user.verify.uuid,
        user.level,
        user.exp,
        user.coin,
        user.likes,
        user.escape,
        user.kill,
        user.death,
        user.assist,
        user.blast,
        user.rescue,
        user.rescueCombo,
        user.survive,
        user.graphics,
        user.memo,
        user.lastChatTime,
        user.id
      ])
      return true
    } catch (e) {
      console.error(e)
    }
  },
  async FindMyClanByUserId(id) {
    try {
      const [row] = await this.query('SELECT * FROM clanMembers WHERE user_id = ?', [id])
      return row
    } catch (e) {
      console.error(e)
    }
  },
  async GetClanMembers(clanId) {
    try {
      return await this.query('SELECT * FROM clanMembers WHERE clan_id = ?', [clanId])
    } catch (e) {
      console.error(e)
    }
  },
  async CreateClan(masterId, clanname) {
    const conn = await pool.getConnection()
    try {
      await conn.beginTransaction()
      const row = await conn.query('INSERT INTO clans (master_id, name) VALUES (?, ?)', [masterId, clanname])
      await conn.query('INSERT INTO clanMembers (clan_id, user_id) VALUES (?, ?)', [row.insertId, masterId])
      await conn.commit()
      return row
    } catch (e) {
      await conn.rollback()
      console.error(e)
    } finally {
      conn.release()
    }
  },
  async FindInviteClan(clanId, userId) {
    try {
      return await this.query('SELECT * FROM inviteClans WHERE clan_id = ? AND target_id = ?', [clanId, userId])
    } catch (e) {
      console.error(e)
    }
  },
  async ClearInviteClan(userId) {
    try {
      await this.query('DELETE FROM inviteClans WHERE target_id = ?', [userId])
    } catch (e) {
      console.error(e)
    }
  },
  async GetInviteClans(userId) {
    try {
      return await this.query('SELECT * FROM inviteClans WHERE target_id = ?', [userId])
    } catch (e) {
      console.error(e)
    }
  },
  async InviteClan(clanId, userId, targetId) {
    try {
      await this.query('INSERT INTO inviteClans (clan_id, user_id, target_id) VALUES (?, ?, ?)', [clanId, userId, targetId])
      return true
    } catch (e) {
      console.error(e)
    }
  },

  async EnterClan(clanId, userId) {
    try {
      await this.query('INSERT INTO clanMembers (clan_id, user_id) VALUES (?, ?)', [clanId, userId])
      return true
    } catch (e) {
      console.error(e)
    }
  },
  async LeaveClan(userId) {
    try {
      await this.query('DELETE FROM clanMembers WHERE user_id = ?', [userId])
      return true
    } catch (e) {
      console.error(e)
    }
  },
  async DeleteInviteClan(clanId) {
    try {
      await this.query('DELETE FROM inviteClans WHERE clan_id = ?', [clanId])
      return true
    } catch (e) {
      console.error(e)
    }
  },
  async DeleteClan(clanId) {
    try {
      await this.query('DELETE FROM clans WHERE id = ?', [clanId])
      return true
    } catch (e) {
      console.error(e)
    }
  },
  async InsertBlock(loginType, uid, uuid, description, date) {
    try {
      await this.query('INSERT INTO blocks (login_type, uid, uuid, description, date) VALUES (?, ?, ?, ?, DATE_ADD(NOW(), INTERVAL ? DAY))', [loginType, uid, uuid, description, date])
      return true
    } catch (e) {
      console.error(e)
    }
  }
}