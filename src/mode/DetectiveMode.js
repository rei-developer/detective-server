const {
  TeamType,
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
    this.trash = []
    this.trashUsers = []
    this.nextTrashUid = 0
    this.count = 570
    this.maxCount = 600
    this.deadCount = 0
    this.fuse = false
    this.corpses = 0
    this.tick = 0
    this.state = STATE_READY
    this.room = Room.get(this.roomId)
    const objects = require(`../../Assets/Modes/${this.type}.json`)[this.map]
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
      maxCount: this.maxCount
    }
  }

  gameObject() {
    return {
      no: 0,
      team: TeamType.CITIZEN,
      status: [],
      inventory: [],
      nextItemUid: 0,
      hp: 100,
      count: 0,
      wardrobe: null,
      washer: false,
      sink: false,
      result: false
    }
  }

  join(self) {
    self.game = this.gameObject()
    self.game.no = this.users.indexOf(self) + 1
    self.setGraphics(self.graphics)
    this.users.push(self)
    this.moveToBase(self)
    self.send(Serialize.SetGameNo(self))
    self.publishToMap(Serialize.SetGameTeam(self))
    self.publish(Serialize.ModeData(this))
  }

  leave(self) {
    this.users.splice(this.users.indexOf(self), 1)
    this.trashUsers.splice(this.trashUsers.indexOf(self), 1)
    self.game = {}
    if (!self.tempReboot) {
      self.escape++
      if (self.level >= 5)
        self.setUpExp(-200)
    }
    self.setGraphics(self.graphics)
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

  drawFuse(self) {
    self.send(Serialize.SwitchFuse(self, this.fuse))
  }

  drawLight(self) {
    if (self.game.team === TeamType.CITIZEN)
      self.send(Serialize.SwitchLight(this.room.places[self.place].light))
  }

  drawEvents(self) {
    const { events } = this.room.places[self.place]
    for (const event of events)
      self.send(Serialize.CreateGameObject(event))
  }

  drawUsers(self) {
    const sameMapUsers = this.room.sameMapUsers(self.place)
    sameMapUsers.map(user => {
      if (self !== user && user.state !== PlayerState.Wardrobe) {
        self.send(Serialize.CreateGameObject(user))
        user.send(Serialize.CreateGameObject(self))
      }
    })
  }

  attack(self, target) {
    return true
  }

  doing(self, event) {
    event.doing(self)
    return true
  }

  addItem(self, id, num = 0) {
    if (self.game.inventory.length >= 8) {
      self.send(Serialize.InformMessage('<color=red>인벤토리가 꽉 찼습니다.</color>'))
      return false
    }
    const itemInfo = Item.get(id)
    const newNum = num > 0 ? num : itemInfo.num
    const item = self.game.inventory.find(item => item.id === id)
    if (item) {
      if (itemInfo.maxNum < item.num + newNum) {
        self.send(Serialize.InformMessage('<color=red>해당 도구는 더는 가질 수 없습니다.</color>'))
        return false
      }
      item.num += newNum
      self.send(Serialize.SetUpItem(item))
    } else {
      const newItem = {
        index: self.game.nextItemUid++,
        id,
        num: newNum,
        icon: itemInfo.icon,
        name: itemInfo.name,
        description: itemInfo.description,
        jobs: itemInfo.jobs,
        killer: itemInfo.killer
      }
      self.game.inventory.push(newItem)
      self.send(Serialize.AddItem(self, newItem))
    }
    return true
  }

  useItem(self, index) {
    const findIndex = self.game.inventory.findIndex(item => item.index === index)
    if (findIndex < 0)
      return
    const item = self.game.inventory[findIndex]
    if (!item)
      return
    const itemInfo = Item.get(item.id)
    if (itemInfo.killer) {
      if (self.game.team === TeamType.KILLER) {
        if (this.deadCount > 0)
          return self.publish(Serialize.InformMessage(`<color=red>${this.deadCount}초 후에 살해할 수 있습니다.</color>`))
      } else {
        return self.send(Serialize.InformMessage('<color=red>살인자 전용 도구입니다.</color>'))
      }
    }
    if (itemInfo.jobs && itemInfo.jobs.indexOf(self.game.jobs) < 0)
      return self.send(Serialize.InformMessage('<color=red>직업이 달라 사용할 수 없는 도구입니다.</color>'))
    itemInfo.doing(self)
    if (!itemInfo.use)
      return
    self.send(Serialize.UseItem(index))
    if (--item.num < 1)
      this.removeItem(self, index, findIndex)
  }

  removeItem(self, index, findIndex) {
    const item = self.game.inventory[findIndex]
    if (!item)
      return
    self.game.inventory.splice(findIndex, 1)
    self.send(Serialize.RemoveItem(index))
  }

  dropItem(self, index) {
    const findIndex = self.game.inventory.findIndex(item => item.index === index)
    if (findIndex < 0)
      return
    const item = self.game.inventory[findIndex]
    if (!item)
      return console.log("왜 막히지")
    const itemInfo = Item.get(item.id)
    const newItem = {
      index: this.nextTrashUid++,
      id: item.id,
      num: item.num,
      icon: itemInfo.icon,
      name: itemInfo.name,
      description: itemInfo.description,
      jobs: itemInfo.jobs,
      killer: itemInfo.killer
    }
    this.trash.push(newItem)
    for (const user of this.trashUsers)
      user.send(Serialize.AddTrash(user, newItem))
    this.removeItem(self, index, findIndex)
  }

  pickUpTrash(self, index) {
    const findIndex = this.trash.findIndex(item => item.index === index)
    if (findIndex < 0)
      return
    const item = this.trash[findIndex]
    if (!item)
      return
    if (!this.addItem(self, item.id, item.num))
      return
    this.trash.splice(findIndex, 1)
    this.publishToTrash(Serialize.RemoveTrash(index))
  }

  leaveTrash(self) {
    const findIndex = this.trashUsers.findIndex(user => user === self)
    if (findIndex < 0)
      return
    const user = this.trashUsers[findIndex]
    if (!user)
      return
    this.trashUsers.splice(findIndex, 1)
    this.publishToTrash(Serialize.RemoveUserTrash(self.index))
  }

  publishToKiller(data) {
    const killer = this.users.find(u => u.game.team === TeamType.KILLER)
    if (killer)
      killer.send(data)
  }

  publishToCitizen(data) {
    const users = this.users.filter(u => u.game.team === TeamType.CITIZEN)
    for (const user of users)
      user.send(data)
  }

  publishToTrash(data) {
    for (const user of this.trashUsers)
      user.send(data)
  }

  result(ending) {
    this.state = STATE_RESULT
    const slice = this.room.users.slice(0)
    for (const user of slice) {
      if (ending === EndingType.KILLER && user.game.team === TeamType.KILLER)
        user.score.sum += user.score.kill * 10
      else if (ending === EndingType.CITIZEN && user.game.team === TeamType.CITIZEN)
        user.score.sum += 100
      else if (ending === EndingType.DRAW)
        user.score.sum += 50
      user.roomId = 0
      user.game.result = true
    }
    const ranks = slice.sort((a, b) => b.score.sum - a.score.sum)
    const persons = slice.length
    for (const user of this.users) {
      const mission = `살해 ${user.score.kill}`
      let exp = 100 + user.score.sum
      let coin = 50 + parseInt(user.score.sum / 2)
      if (exp < 100) exp = 100
      if (coin < 50) coin = 50
      const rank = ranks.indexOf(user) + 1
      const reward = `${coin} COIN\n${exp} RP`
      user.reward.exp = exp
      user.reward.coin = coin
      user.send(Serialize.ResultGame(ending, rank, persons, mission, reward))
    }
    Room.remove(this.room)
  }

  update() {
    if (++this.tick % 10 === 0) {
      this.tick = 0
      switch (this.state) {
        case STATE_READY:
          if (this.count <= 600 && this.count > 570) {
            if (this.count === 580)
              this.room.publish(Serialize.PlaySound('GhostsTen'))
            this.room.publish(Serialize.NoticeMessage(this.count - 570))
          } else if (this.count === 570) {
            this.room.lock = true
            this.state = STATE_GAME
            const killer = pix.sample(this.users)[0]
            if (killer) {
              killer.game.team = TeamType.KILLER
              if (killer.state === PlayerState.Wardrobe) {
                killer.setState('Basic')
                killer.send(Serialize.LeaveWardrobe())
                killer.game.wardrobe.users.splice(killer.game.wardrobe.users.indexOf(killer), 1)
                killer.game.wardrobe = null
              }
              killer.send(Serialize.SetGameTeam(killer))
            }
            const jobs = [...Array(8)].map((_, i) => i).sort(() => Math.random() - Math.random())
            this.users.map((user, index) => {
              user.game.jobs = jobs[index]
              user.send(Serialize.SetGameJobs(user))
              const items = [...Array(Object.keys(Item.items).length - 1)].map((_, i) => i).sort(() => Math.random() - Math.random())
              for (let i = 0; i < 5; i++)
                this.addItem(user, items[i] + 1)
            })
            this.room.publish(Serialize.PlaySound('Shock'))
          }
          break
        case STATE_GAME:
          if (this.deadCount > 0)
            --this.deadCount
          if (this.corpses < 1 && this.count % 60 === 0)
            this.publishToKiller(Serialize.NoticeMessage(`${this.count}초 안에 첫살인을 마쳐야 합니다!!`))
          if (this.corpses >= 1) // 5 || this.users.length < 3)
            this.result(EndingType.KILLER)
          if (this.count === 5)
            this.room.publish(Serialize.PlaySound('Second'))
          else if (this.count === 0) {
            if (this.corpses > 0)
              this.count = 60
            else
              this.result(EndingType.DRAW)
          }
          break
      }
      --this.count
    }
  }
}