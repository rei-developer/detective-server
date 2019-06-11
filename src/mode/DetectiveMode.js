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
const GameMap = require('../GameMap')
const PlayerState = require('../PlayerState')

const STATE_READY = 0
const STATE_GAME = 1
const STATE_VOTE = 2
const STATE_RESULT = 3

module.exports = class DetectiveMode {
  constructor(roomId) {
    this.roomId = roomId
    this.type = ModeType.DETECTIVE
    this.map = MapType.ISLAND
    this.users = []
    this.trash = []
    this.trashUsers = []
    this.nextTrashIndex = 0
    this.count = 600
    this.maxCount = 600
    this.deadCount = 0
    this.pureDeadCount = 40
    this.fuse = false
    this.corpses = 0
    this.target = null
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
      maxCount: this.maxCount,
      state: this.state
    }
  }

  gameObject() {
    return {
      no: 0,
      team: TeamType.CITIZEN,
      jobs: JobsType.DOCTOR,
      status: [],
      inventory: [],
      nextItemIndex: 0,
      hp: 100,
      count: 0,
      fuse: 0,
      pointed: 0,
      vote: null,
      wardrobe: null,
      washer: false,
      sink: false,
      likes: true,
      result: false,
      poison: new Date().getTime()
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
    if (self.hasOwnProperty('game') && self.game.hasOwnProperty('team') && self.game.team === TeamType.KILLER)
      this.result(EndingType.CITIZEN)
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
        self.teleport(173, 11, 9)
        break
    }
  }

  moveToVote(self) {
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

  addItem(self, id, num = 0, inform = false) {
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
        index: self.game.nextItemIndex++,
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
      if (inform) {
        self.send(Serialize.InformMessage(`<color=#B5E61D>${itemInfo.name} 획득!</color>`))
        self.send(Serialize.PlaySound('thump'))
      }
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
          return self.send(Serialize.InformMessage(`<color=red>${this.deadCount}초 후에 사용할 수 있습니다.</color>`))
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
      return
    const itemInfo = Item.get(item.id)
    const newItem = {
      index: this.nextTrashIndex++,
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
    this.publishToTrash(Serialize.RemoveUserTrash(self.index, this.trashUsers.length))
  }

  selectVote(self, index) {
    if (self.game.vote)
      return
    const findIndex = this.users.findIndex(user => user.index === index)
    if (findIndex < 0)
      return
    const user = this.users[findIndex]
    if (!user)
      return
    if (self.game.vote === user)
      return
    self.game.vote = user
    ++user.game.pointed
    this.room.publish(Serialize.SetUpVote(user))
  }

  randomSupply() {
    const objects = require(`../../Assets/Events/1.json`)[1]
    for (const object of objects) {
      const range = 3
      for (let i = 173; i <= 207; i++) {
        const map = GameMap.get(i)
        const event = new Event(this.roomId, object)
        const x = Math.floor(-range + Math.random() * (range * 2) + 1)
        const y = Math.floor(-range + Math.random() * (range * 2) + 1)
        event.place = i
        event.x = Math.floor(map.width / 2) + x
        event.y = Math.floor(map.height / 2) + y
        this.room.addEvent(event)
        this.room.publishToMap(event.place, Serialize.CreateGameObject(event))
      }
    }
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

  vote(name) {
    this.count = 50
    this.state = STATE_VOTE
    for (const user of this.users)
      this.moveToVote(user)
    this.room.publish(Serialize.NoticeMessage(`${name}님의 요청으로 추리를 시작하겠습니다.`))
    this.room.publish(Serialize.PlaySound('squeaky'))
  }

  result(ending) {
    this.state = STATE_RESULT
    const slice = this.room.users.slice(0)
    for (const user of slice) {
      if (ending === EndingType.KILLER && user.game.team === TeamType.KILLER)
        user.score.sum += user.score.kill * 20
      else if (ending === EndingType.CITIZEN && user.game.team === TeamType.CITIZEN) {
        if (user.game.vote === this.target)
          user.score.sum += 50
        user.score.sum += 50
      } else if (ending === EndingType.DRAW)
        user.score.sum += 50
      user.roomId = 0
      user.game.result = true
    }
    const ranks = slice.sort((a, b) => b.score.sum - a.score.sum)
    for (const user of this.users) {
      let exp = 100 + user.score.sum
      let coin = 50 + parseInt(user.score.sum / 2)
      if (exp < 100)
        exp = 100
      if (coin < 50)
        coin = 50
      user.reward.exp = exp
      user.reward.coin = coin
    }
    this.room.publish(Serialize.ResultGame(ending, ranks))
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
            const jobs = [...Array(JobsType.ARBEIT)].map((_, i) => i).sort(() => Math.random() - Math.random())
            this.users.map((user, index) => {
              user.game.jobs = jobs[index]
              user.send(Serialize.SetGameJobs(user))
              const items = [...Array(Object.keys(Item.items).length - 1)].map((_, i) => i).sort(() => Math.random() - Math.random())
              for (let i = 0; i < 5; i++)
                this.addItem(user, items[i] + 1)
            })
            this.randomSupply()
            this.room.publish(Serialize.PlaySound('Shock'))
          }
          break
        case STATE_GAME:
          if (this.deadCount > 0)
            --this.deadCount
          if (this.corpses < 3 && this.count % 60 === 0)
            this.publishToKiller(Serialize.NoticeMessage(`${this.count}초 안에 3명을 살인해야 합니다!!`))
          if (this.corpses >= 5 || this.users.length < 4)
            this.result(EndingType.KILLER)
          else if (this.count === 0) {
            if (this.corpses < 3)
              this.result(EndingType.DRAW)
          }
          break
        case STATE_VOTE:
          if (this.count === 45) {
            this.deadCount = 30
            this.room.publish(Serialize.UpdateRoomModeInfo(this))
            this.room.publish(Serialize.GetVote(this.users))
          } else if (this.count === 20) {
            this.room.publish(Serialize.PlaySound('Second'))
          } else if (this.count === 15) {
            this.room.publish(Serialize.CloseVote())
            this.room.publish(Serialize.NoticeMessage('모든 사람들의 투표가 끝났습니다. 가장 많이 지목을 받은 사람은...'))
          } else if (this.count === 10) {
            const users = this.users.sort((a, b) => b.game.pointed - a.game.pointed)
            this.target = users[0]
            this.room.publish(Serialize.NoticeMessage(`<color=red>${this.target.name}</color> 바로 당신이야!! 당신이 이 살인사건의 범인이지??`))
          } else if (this.count === 5) {
            if (this.target.game.team === TeamType.KILLER) {
              this.room.publish(Serialize.NoticeMessage('<color=red>이... 이럴수가... 내가 범인인걸 어떻게 알아냈지?</color>'))

            } else {
              this.room.publish(Serialize.NoticeMessage('<color=red>나는 도대체 당신이 무슨 말을 하는지 모르겠는데? 전혀 근거가 안 맞잖아?</color>'))

            }
          } else if (this.count === 0)
            this.result(this.target.game.team === TeamType.KILLER ? EndingType.CITIZEN : EndingType.KILLER)
      }
      --this.count
    }
  }
}