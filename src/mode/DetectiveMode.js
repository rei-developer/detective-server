const {
  TeamType,
  JobsType,
  ModeType,
  MapType,
  EndingType
} = require('../library/const')
const pix = require('../library/pix')
const Serialize = require('../protocol/Serialize')
const Event = require('../Event')
const PlayerState = require('../PlayerState')

const STATE_READY = 0
const STATE_GAME = 1
const STATE_RESULT = 3

module.exports = class DetectiveMode {
  constructor(roomId) {
    this.roomId = roomId
    this.type = ModeType.DETECTIVE
    this.map = MapType.ISLAND
    this.users = []
    this.count = 600
    this.maxCount = 600
    this.corpses = 0
    this.tick = 0
    this.state = STATE_READY
    this.room = Room.get(this.roomId)
    const objects = require('../../Assets/Mods/Mod' + ('' + 1).padStart(3, '0') + '.json')[this.map]
    for (const object of objects) {
      const event = new Event(this.roomId, object)
      this.room.addEvent(event)
    }
  }

  getJSON() {
    return {
      map: this.map,
      mode: ModeType.DETECTIVE,
      count: this.count,
      maxCount: this.maxCount,
      corpses: this.corpses
    }
  }

  moveToBase(self) {
    switch (this.map) {
      case MapType.ISLAND:
        self.teleport(2, 8, 13)
        break
    }
  }

  moveToVotingStand(self) {
    switch (this.map) {
      case MapType.ISLAND:
        self.teleport(13, 11, 15)
        break
    }
  }

  join(self) {
    self.game = this.gameObject()
    self.setGraphics(self.graphics)
    this.users.push(self)
    this.moveToBase(self)
    self.publishToMap(Serialize.SetGameTeam(self))
    self.publish(Serialize.ModeData(this))
  }

  drawAkari(self) {
    if (self.game.team === TeamType.CITIZEN) {
      self.send(Serialize.SwitchLight(this.room.places[self.place].akari))
    }
  }

  drawEvents(self) {
    const { events } = this.room.places[self.place]
    for (const event of events)
      self.send(Serialize.CreateGameObject(event))
  }

  drawUsers(self) {
    const sameMapUsers = this.room.sameMapUsers(self.place)
    for (const user of sameMapUsers) {
      if (self === user) continue
      if (user.state === PlayerState.Wardrobe) continue
      self.send(Serialize.CreateGameObject(user))
      user.send(Serialize.CreateGameObject(self))
    }
  }

  attack(self, target) {
    return true
  }

  doAction(self, event) {
    event.doAction(self)
    return true
  }

  leave(self) {
    this.users.splice(this.users.indexOf(self), 1)
    self.game = {}
    if (!self.tempReboot) {
      self.escape++
      if (self.level >= 5) self.setUpExp(-200)
    }
    self.setGraphics(self.graphics)
  }

  gameObject() {
    return {
      team: TeamType.CITIZEN,
      hp: 100,
      count: 0,
      spawnTime: 10,
      wardrobe: null,
      result: false
    }
  }

  publishToKiller(data) {
    const users = this.users.filter(user => user.game.team === TeamType.KILLER)
    for (const user of users)
      user.send(data)
  }

  publishToCitizen(data) {
    const users = this.users.filter(user => user.game.team === TeamType.CITIZEN)
    for (const user of users)
      user.send(data)
  }

  result(ending) {
    /*this.state = STATE_RESULT
    const slice = this.room.users.slice(0)
    for (const user of slice) {
      user.roomId = 0
      user.game.result = true
    }
    Room.remove(this.room)
    for (const red of this.redTeam) {
      red.score.sum += red.score.kill * 10 + red.score.killForWardrobe * 50
    }
    for (const blue of this.blueTeam) {
      blue.score.sum += blue.score.rescue * 10 + blue.score.rescueCombo * 10 - blue.score.death * 10 - blue.score.deathForWardrobe * 20
    }
    const ranks = slice.sort((a, b) => b.score.sum - a.score.sum)
    const persons = slice.length
    for (const red of this.redTeam) {
      const mission = "킬 " + red.score.kill + "\n장농 킬 " + red.score.killForWardrobe
      let exp = 100 + red.score.sum
      let coin = 50 + parseInt(red.score.sum / 2)
      if (exp < 100) exp = 100
      if (coin < 50) coin = 50
      const rank = ranks.indexOf(red) + 1
      const reward = coin + " GOLD\n" + exp + " EXP"
      red.reward.exp = exp
      red.reward.coin = coin
      red.send(Serialize.ResultGame(winner, rank, persons, mission, reward))
    }
    for (const blue of this.blueTeam) {
      const mission = "구출 " + blue.score.rescue + " (" + blue.score.rescueCombo + "콤보)\n수감 " + (blue.score.death + blue.score.deathForWardrobe)
      let exp = 100 + blue.score.sum
      let coin = 50 + parseInt(blue.score.sum / 2)
      if (exp < 100) exp = 100
      if (coin < 50) coin = 50
      const rank = ranks.indexOf(blue) + 1
      const reward = coin + " GOLD\n" + exp + " EXP"
      blue.reward.exp = exp
      blue.reward.coin = coin
      blue.send(Serialize.ResultGame(winner, rank, persons, mission, reward))
    }*/
  }

  update() {
    if (++this.tick % 10 === 0) {
      this.tick = 0
      switch (this.state) {
        case STATE_READY:
          if (this.count <= 600 && this.count > 570) {
            if (this.count === 580) this.room.publish(Serialize.PlaySound('GhostsTen'))
            this.room.publish(Serialize.NoticeMessage(this.count - 570))
          } else if (this.count === 570) {
            this.room.lock = true
            this.state = STATE_GAME
            const jobs = [...Array(8)].map((_, i) => i).sort(() => Math.random() - Math.random())
            this.users.map((user, index) => {
              console.log(jobs[index])
              user.game.jobs = jobs[index]
              user.send(Serialize.SetGameJobs(user))
            })

            console.log(jobs)

            const killer = pix.sample(this.users)[0]
            if (killer) {
              killer.game.team = TeamType.KILLER
              if (killer.state === PlayerState.Wardrobe) {
                killer.setState('Basic')
                killer.send(Serialize.LeaveWardrobe())
                this.drawAkari(killer)
                killer.game.wardrobe.users.splice(killer.game.wardrobe.users.indexOf(killer), 1)
                killer.game.wardrobe = null
              }
              killer.send(Serialize.SetGameTeam(killer))
            }
            this.room.publish(Serialize.NoticeMessage('추리 시작'))
            this.room.publish(Serialize.PlaySound('A4'))
          }
          break
        case STATE_GAME:
          /*if (this.count === 5 || this.count % 40 === 0) {
            this.caught = true
            this.room.publish(Serialize.InformMessage('<color=#B5E61D>인질 구출이 가능합니다!</color>'))
            this.room.publish(Serialize.PlaySound('thump'))
          }*/
          if (this.corpses >= 5) this.result(EndingType.KILLER)
          else if (this.users.length < 3) this.result(EndingType.DRAW)
          else if (this.count === 5) this.room.publish(Serialize.PlaySound('Second'))
          else if (this.count === 0) this.result(EndingType.DRAW)
          break
      }
      // if (this.count % 10 === 0) room.publish('gameInfo', { count: this.count, maxCount: this.maxCount })
      --this.count
    }
  }
}