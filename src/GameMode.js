const {
  ModeType,
  MapType
} = require('./library/const')
const Serialize = require('./protocol/Serialize')
const DetectiveMode = require('./mode/DetectiveMode')
const Event = require('./Event')

module.exports = class GameMode {
  constructor(roomId) {
    this.roomId = roomId
    this.map = MapType.ISLAND
    this.count = 0
    this.type = 0
    this.room = Room.get(this.roomId)
    const objects = require('../Assets/Mods/Eve000.json')[3]
    for (const object of objects) {
      const range = 3
      for (let i = 0; i < 10; i++) {
        const event = new Event(this.roomId, object)
        const x = Math.floor(-range + Math.random() * (range * 2 + 1))
        const y = Math.floor(-range + Math.random() * (range * 2 + 1))
        event.place = 2
        event.x = 8 + x
        event.y = 13 + y
        this.room.addEvent(event)
        this.room.publishToMap(event.place, Serialize.CreateGameObject(event))
      }
    }
  }

  moveToBase(self) {
    switch (this.map) {
      case MapType.ISLAND:
        self.teleport(2, 8, 13)
        break
    }
  }

  join(self) {
    self.game = {}
    self.setGraphics(self.graphics)
    this.moveToBase(self)
  }

  leave(self) {
    self.game = {}
    self.setGraphics(self.graphics)
  }

  drawAkari(self) {
    self.send(Serialize.SwitchLight(this.room.places[self.place].akari))
  }

  drawEvents(self) {
    const { events } = this.room.places[self.place]
    for (const event of events) {
      self.send(Serialize.CreateGameObject(event))
    }
  }

  drawUsers(self) {
    const sameMapUsers = this.room.sameMapUsers(self.place)
    for (const user of sameMapUsers) {
      if (self === user) continue
      user.send(Serialize.CreateGameObject(self))
      self.send(Serialize.CreateGameObject(user))
    }
  }

  attack(self, target) {
    return true
  }

  doAction(self, event) {
    event.doAction(self)
    return true
  }

  update() {
    if (this.room.users.length >= 1) {
      const mode = ModeType.DETECTIVE
      switch (mode) {
        case ModeType.DETECTIVE:
          this.room.changeMode(DetectiveMode)
          break
      }
      return
    } else {
      if (this.count % 100 === 0) {
        this.room.publish(Serialize.NoticeMessage('4명 이상이어야 합니다. (' + this.room.users.length + '/' + this.room.max + '명)'))
      }
    }
    if (++this.count === 10000) this.count = 0
  }
}