const {
  TeamType,
  StatusType,
  DeathType
} = require('./library/const')
const pix = require('./library/pix')
const Serialize = require('./protocol/Serialize')
const PlayerState = require('./PlayerState')

const dr = [
  [1, 0], [-1, 0], [0, 1], [0, -1], [1, 0]
]

class DefaultAction {
  constructor(args = {}) { }

  doing(self, event) { }

  update(event) { }
}

class DoorAction {
  constructor(args = {}) {
    this.openSound = args['openSound'] || 'door03'
    this.closeSound = args['closeSound'] || 'door04'
    this.toggle = false
  }

  doing(self, event) {
    self.publishToMap(Serialize.PlaySound(this.toggle ? this.closeSound : this.openSound))
    event.move(this.toggle ? -1 : 1, 0)
    this.toggle = !this.toggle
  }
}

class HingedDoorAction {
  constructor(args = {}) {
    this.toggle = false
  }

  doing(self, event) {
    self.publishToMap(Serialize.PlaySound('Sha'))
    event.move(this.toggle ? -1 : 1, 0)
    this.toggle = !this.toggle
  }
}

class VoteAction {
  constructor(args = {}) {
    this.count = 0
  }

  doing(self, event) {
    const room = Room.get(self.roomId)
    if (room.mode.state !== 1)
      return
    if (room.mode.corpses < 3)
      return self.send(Serialize.InformMessage('<color=red>3번째 살인 이후부터 투표가 가능합니다.</color>'))
    const persons = room.places[self.place].users.length
    if (persons < 3)
      return self.send(Serialize.InformMessage('<color=red>이곳에 3명 이상이 모여야 투표가 가능합니다.</color>'))
    room.mode.vote(self.name)
  }
}

class FuseAction {
  constructor(args = {}) {
    this.count = 0
  }

  doing(self, event) {
    const room = Room.get(self.roomId)
    const fuse = room.mode.fuse = !room.mode.fuse
    for (const user of room.mode.users) {
      if (user.state === PlayerState.Wardrobe)
        continue
      if (!room.mode.fuse)
        user.publish(Serialize.InformMessage('<color=red>퓨즈를 다시 올렸습니다. 불이 다시 켜졌습니다.</color>'))
      user.publishToMap(Serialize.PlaySound(fuse ? 'clap00' : 'clap01'))
      room.mode.drawFuse(user)
    }
  }
}

class TrashAction {
  constructor(args = {}) { }

  doing(self, event) {
    const room = Room.get(self.roomId)
    if (room.mode.trashUsers.indexOf(self) >= 0)
      return
    room.mode.publishToTrash(Serialize.AddUserTrash(self, room.mode.trashUsers.length + 1))
    room.mode.trashUsers.push(self)
    self.send(Serialize.GetTrash(self, room.mode.trash, room.mode.trashUsers))
  }
}

class LightAction {
  constructor(args = {}) {
    this.count = 0
  }

  doing(self, event) {
    const room = Room.get(self.roomId)
    const light = room.light(self.place)
    const users = room.sameMapUsers(self.place)
    for (const user of users) {
      if (user.state === PlayerState.Wardrobe)
        continue
      user.publishToMap(Serialize.PlaySound(light ? 'clap01' : 'clap00'))
      room.mode.drawLight(user)
    }
  }

  update(event) {
    if (++this.count % 4 == 0) {
      const room = Room.get(event.roomId)
      if (!room)
        return
      // const killer = room.places[event.place].users.find(u => u.game.team === TeamType.KILLER)
      // if (killer) {
      const users = room.sameMapUsers(event.place)
      for (const user of users) {
        if (user.state === PlayerState.Wardrobe)
          continue
        room.mode.drawLight(user)
      }
      // }
      this.count = 0
    }
  }
}

class WasherAction {
  constructor(args = {}) { }

  doing(self, event) {
    if (self.game.washer)
      return self.send(Serialize.InformMessage('<color=red>이미 이용한 세탁기입니다. 더는 이용할 수 없습니다.</color>'))
    self.game.washer = true
    self.publishToMap(Serialize.PlaySound('washer'))
    const blood = self.game.status.find(s => s === StatusType.BLOOD)
    if (blood) {
      const washedBlood = self.game.status.find(s => s === StatusType.WASHED_BLOOD)
      if (!washedBlood)
        self.game.status.push(StatusType.WASHED_BLOOD)
      self.game.status.splice(self.game.status.indexOf(StatusType.BLOOD), 1)
    }
    self.send(Serialize.InformMessage('<color=#B5E61D>옷을 세탁하여 혈흔을 지웠습니다. (단, 루미놀 검사는 양성 판정)</color>'))
    self.send(Serialize.SetGameStatus(self))
  }
}

class SinkAction {
  constructor(args = {}) { }

  doing(self, event) {
    if (self.game.sink)
      return self.send(Serialize.InformMessage('<color=red>이미 이용한 개수대입니다. 더는 이용할 수 없습니다.</color>'))
    self.game.sink = true
    self.publishToMap(Serialize.PlaySound('sink'))
    const mud = self.game.status.find(s => s === StatusType.MUD)
    if (mud)
      self.game.status.splice(self.game.status.indexOf(StatusType.MUD), 1)
    self.send(Serialize.InformMessage('<color=#B5E61D>옷과 신발에 묻은 진흙을 깨끗이 씻었습니다.</color>'))
    self.send(Serialize.SetGameStatus(self))
  }
}

class ObstacleAction {
  constructor(args = {}) {
    this.moveSound = args['moveSound'] || '3'
  }

  doing(self, event) {
    const room = Room.get(event.roomId)
    if (!room)
      return
    self.publishToMap(Serialize.PlaySound(this.moveSound))
    if (room.isPassable(self.place, event.x + self.direction.x, event.y - self.direction.y, self.direction, true))
      event.move(self.direction.x, -self.direction.y)
    else
      event.move(-self.direction.x, self.direction.y)
  }
}

class WardrobeAction {
  constructor(args = {}) {
    this.users = []
  }

  doing(self, event) {
    if (self.direction.x !== 0 || self.direction.y !== 1)
      return
    const room = Room.get(event.roomId)
    if (!room)
      return
    const { mode } = room
    if (self.game.team === TeamType.CITIZEN) {
      if (self.state === PlayerState.Wardrobe) {
        self.state = PlayerState.Basic
        self.send(Serialize.LeaveWardrobe())
        this.users.splice(this.users.indexOf(self), 1)
        self.game.wardrobe = null
        self.publishToMap(Serialize.PlaySound('Close1'))
        self.broadcastToMap(Serialize.CreateGameObject(self))
        mode.drawLight(self)
      } else {
        if (this.users.length >= 1) {
          self.send(Serialize.InformMessage('<color=red>장농 안에 누군가 있다.</color>'))
          self.publishToMap(Serialize.PlaySound('Crash'))
          return
        }
        self.setState('Wardrobe')
        self.game.wardrobe = this
        this.users.push(self)
        self.send(Serialize.EnterWardrobe())
        self.publishToMap(Serialize.PlaySound('Close1'))
        self.broadcastToMap(Serialize.RemoveGameObject(self))
      }
    } else {
      self.publishToMap(Serialize.PlaySound('Crash'))
      if (this.users.length > 0 && parseInt(Math.random() * 20 + 1) === 1) {
        const target = pix.sample(this.users, 1)[0]
        this.users.splice(this.users.indexOf(target), 1)
        if (target) {
          target.game.wardrobe = null
          this.users.splice(this.users.indexOf(target), 1)
          mode.attack(self, target)
        }
      }
    }
  }
}

class RescueAction {
  constructor(args = {}) {
    this.count = 0
  }

  doing(self, event) {
    const { mode } = Room.get(event.roomId)
    if (self.game.team === TeamType.RED || self.game.caught) return
    if (!mode.caught) return self.send(Serialize.InformMessage('<color=#B5E61D>아직 인질을 구출할 수 없습니다.</color>'))
    if (mode.score.red < 1) return self.send(Serialize.InformMessage('<color=#B5E61D>붙잡힌 인질이 없습니다.</color>'))
    let count = 0
    /*for (const red of mode.redTeam)
      mode.moveToKickOut(red)
    for (const blue of mode.blueTeam) {
      if (blue.game.caught) {
        blue.teleport(self.place, self.x, self.y)
        blue.game.caught = false
        ++count
      }
    }
    mode.score.red = 0*/
    mode.caught = false
    self.publish(Serialize.NoticeMessage(self.name + ' 인질 ' + count + '명 구출!'))
    self.publish(Serialize.PlaySound('Rescue'))
    //self.publish(Serialize.UpdateModeUserCount(0))
    self.score.rescue += count
    ++self.score.rescueCombo
  }

  update(event) {
    if (++this.count % 10 == 0) {
      const { mode } = Room.get(event.roomId)
      /*for (const red of mode.redTeam) {
        if (red.place === event.place) {
          const range = Math.abs(red.x - event.x) + Math.abs(red.y - event.y)
          if (range > 2) continue
          if (red.game.hp < 0) {
            mode.moveToBase(red)
            red.game.hp = 100
            red.send(Serialize.InformMessage('<color=red>인질구출 스위치에서 벗어나지 않아 강제로 추방되었습니다.</color>'))
          } else {
            red.game.hp -= 35
            red.send(Serialize.InformMessage('<color=red>인질구출 스위치에서 벗어나세요!!!!</color>'))
            red.send(Serialize.PlaySound('Warn'))
          }
        }
      }*/
      this.count = 0
    }
  }
}

class BoxAction {
  constructor(args = {}) { }

  doing(self, event) {
    const room = Room.get(self.roomId)
    const item = parseInt(Math.random() * Object.keys(Item.items).length) + 1
    room.mode.addItem(self, item, 0, true)
    event.publishToMap(Serialize.RemoveGameObject(event))
    room.removeEvent(event)
  }
}

class NpcAction {
  constructor(args = {}) {
    this.count = 0
    this.step = 0
    this.i = 0
    this.msgCount = -1
    this.message = args['message']
    this.fixed = args['fixed']
  }

  doing(self, event) {
    if (event.death > 0 && event.deathCount < 1) {
      self.send(Serialize.InformMessage(`<color=red>${event.name}${(pix.maker(event.name) ? '가' : '이')} 죽어있습니다.</color>`))
    } else {
      this.msgCount = (++this.msgCount) % this.message.length
      self.send(Serialize.ChatMessage(event.type, event.index, `<color=#B5E61D>${event.name}</color>`, this.message[this.msgCount]))
    }
  }

  update(event) {
    if (this.fixed)
      return
    const room = Room.get(event.roomId)
    if (!room)
      return
    this.count++
    if (event.death > 0 && event.deathCount < 1) {
      if (this.count % 10 === 0) {
        for (const user of room.mode.users) {
          if (user.place === event.place) {
            const range = Math.abs(user.x - event.x) + Math.abs(user.y - event.y)
            if (range >= 5)
              continue
            const itemInfo = Item.get(event.death)
            if (itemInfo.type === DeathType.UNKNOWN || itemInfo.type === DeathType.STRANGULATION || itemInfo.type === DeathType.NECKTIE_STRANGULATION || itemInfo.type === DeathType.POISON)
              continue
            const blood = user.game.status.find(s => s === StatusType.BLOOD)
            if (blood)
              continue
            user.send(Serialize.PlaySound('Steps'))
            user.game.status.push(StatusType.BLOOD)
            user.send(Serialize.SetGameStatus(user))
          }
        }
      }
    } else {
      if (event.deathCount > 0)
        --event.deathCount
      if (event.deathCount === 1) {
        ++room.mode.corpses
        room.mode.deadCount = 30
        event.publish(Serialize.UpdateRoomModeInfo(room.mode))
        event.collider = false
        event.graphics = `${event.graphics}_D`
        event.publishToMap(Serialize.SetGraphics(event))
        event.publish(Serialize.PlaySound(event.deathSound))
      }
      if (this.count % 100 === 0) {
        if (this.step <= 0) {
          this.i = parseInt(Math.random() * 4)
          this.step = parseInt(Math.random() * 5) + 1
        }
        event.dirty = true
        let i = this.i
        --this.step
        event.direction.x = dr[i][0]
        event.direction.y = -dr[i][1]
        const direction = event.getDirection(dr[i][0], -dr[i][1])
        if (room.isPassable(event.place, event.x, event.y, direction, false) && room.isPassable(event.place, event.x + dr[i][0], event.y + dr[i][1], 10 - direction, true)) {
          event.x += dr[i][0]
          event.y += dr[i][1]
        }
      }
      if (this.count % 500 == 0) {
        this.msgCount = (++this.msgCount) % this.message.length
        event.publishToMap(Serialize.ChatMessage(event.type, event.index, `<color=#B5E61D>${event.name}</color>`, this.message[this.msgCount]))
      }
    }
    if (this.count > 1500)
      this.count = 0
  }
}

class ManiaAction {
  constructor(args = {}) {
    this.count = 0
    this.step = 0
    this.i = 0
    this.msgCount = -1
    this.message = args['message'] // || ['허허... 좀 비켜보시게나.']
    this.fixed = args['fixed']
  }

  doing(self, event) {
    this.msgCount = (++this.msgCount) % this.message.length
    self.send(Serialize.ChatMessage(event.type, event.index, event.name, this.message[this.msgCount]))
  }

  update(event) {
    if (this.fixed)
      return
    const room = Room.get(event.roomId)
    if (!room)
      return
    if (this.step <= 0) {
      this.i = parseInt(Math.random() * 4)
      this.step = parseInt(Math.random() * 5) + 1
    }
    event.dirty = true
    let i = this.i
    --this.step
    event.direction.x = dr[i][0]
    event.direction.y = -dr[i][1]
    const direction = event.getDirection(dr[i][0], -dr[i][1])
    if (room.isPassable(event.place, event.x, event.y, direction, false) && room.isPassable(event.place, event.x + dr[i][0], event.y + dr[i][1], 10 - direction, true)) {
      event.x += dr[i][0]
      event.y += dr[i][1]
    }
    this.count++
    if (this.count % 500 == 0) {
      this.msgCount = (++this.msgCount) % this.message.length
      event.publishToMap(Serialize.ChatMessage(event.type, event.index, event.name, this.message[this.msgCount]))
    }
    if (this.count > 1500)
      this.count = 0
  }
}

class RabbitAction {
  constructor(args = {}) {
    this.count = 0
    this.step = 0
    this.i = 0
    this.msgCount = -1
    this.message = args['message']
    this.fixed = args['fixed']
  }

  doing(self, event) {
    const room = Room.get(event.roomId)
    if (!room)
      return
    self.publish(Serialize.NoticeMessage(self.name + ' 토깽이 사냥!'))
    self.publish(Serialize.PlaySound('Eat'))
    event.publishToMap(Serialize.RemoveGameObject(event))
    room.removeEvent(event)
  }

  update(event) {
    if (this.fixed)
      return
    const room = Room.get(event.roomId)
    if (!room)
      return
    if (this.step <= 0) {
      this.i = parseInt(Math.random() * 4)
      this.step = parseInt(Math.random() * 5) + 1
    }
    event.dirty = true
    let i = this.i
    --this.step
    event.direction.x = dr[i][0]
    event.direction.y = -dr[i][1]
    const direction = event.getDirection(dr[i][0], -dr[i][1])
    if (room.isPassable(event.place, event.x, event.y, direction, false) && room.isPassable(event.place, event.x + dr[i][0], event.y + dr[i][1], 10 - direction, true)) {
      event.x += dr[i][0]
      event.y += dr[i][1]
    }
    this.count++
    if (this.count > 1500)
      this.count = 0
  }
}

module.exports = new Proxy({
  door: DoorAction,
  hingedDoor: HingedDoorAction,
  vote: VoteAction,
  fuse: FuseAction,
  trash: TrashAction,
  light: LightAction,
  washer: WasherAction,
  sink: SinkAction,
  obstacle: ObstacleAction,
  wardrobe: WardrobeAction,
  rescue: RescueAction,
  box: BoxAction,
  npc: NpcAction,
  mania: ManiaAction,
  rabbit: RabbitAction
}, {
    get: function (target, name) {
      return target.hasOwnProperty(name) ? target[name] : DefaultAction
    }
  })