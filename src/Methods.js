const {
  JobsType,
  StatusType,
  DeathType
} = require('./library/const')
const pix = require('./library/pix')
const Serialize = require('./protocol/Serialize')

class DefaultMethod {
  constructor(args = {}) { }

  doing(self, item) { }
}

class LuminorMethod {
  constructor(args = {}) { }

  doing(self, item) {
    const room = Room.get(self.roomId)
    const { users } = room.places[self.place]
    for (const user of users) {
      if (self === user)
        continue
      if (!(self.x === user.x && self.y === user.y || self.x + self.direction.x === user.x && self.y - self.direction.y === user.y))
        continue
      const blood = user.game.status.find(s => s === StatusType.BLOOD)
      const washedBlood = user.game.status.find(s => s === StatusType.WASHED_BLOOD)
      const result = blood || washedBlood ? true : false
      self.send(Serialize.UpdateRoomGameInfo('루미놀 검사 결과', result ? '양성' : '음성', `${user.name}의 몸을 루미놀 검사 지시약으로 판독해보니, ${result ? '혈흔이 묻혀진 것으로 판단된다.' : '아무런 이상이 없는 것으로 판단된다.'}`))
      return self.send(Serialize.PlaySound('result'))
    }
    self.send(Serialize.InformMessage('<color=red>앞에 대상이 없습니다.</color>'))
  }
}

class glovesMethod {
  constructor(args = {}) { }

  doing(self, item) {
    const room = Room.get(self.roomId)
    const { users } = room.places[self.place]
    for (const user of users) {
      if (self === user)
        continue
      if (!(self.x === user.x && self.y === user.y || self.x + self.direction.x === user.x && self.y - self.direction.y === user.y))
        continue
      let status = []
      const blood = user.game.status.find(s => s === StatusType.BLOOD)
      if (blood)
        status.push('혈흔')
      const mud = user.game.status.find(s => s === StatusType.MUD)
      if (mud)
        status.push('진흙')
      const dust = user.game.status.find(s => s === StatusType.DUST)
      if (dust)
        status.push('먼지')
      self.send(Serialize.UpdateRoomGameInfo('몸 수색 결과', status.length > 0 ? '의심 정황' : '이상 없음', `${user.name}의 몸을 수색해보니, ${status.length > 0 ? status.join(', ') + ' 등이 묻혀있다.' : '아무런 이상이 없는 것으로 판단된다.'}`))
      return self.send(Serialize.PlaySound('result'))
    }
    self.send(Serialize.InformMessage('<color=red>앞에 대상이 없습니다.</color>'))
  }
}

class warrantMethod {
  constructor(args = {}) { }

  doing(self, item) {
    const room = Room.get(self.roomId)
    const { users } = room.places[self.place]
    for (const user of users) {
      if (self === user)
        continue
      if (!(self.x === user.x && self.y === user.y || self.x + self.direction.x === user.x && self.y - self.direction.y === user.y))
        continue
      if (user.game.jobs === JobsType.LAWYER) {
        self.send(Serialize.UpdateRoomGameInfo('수색영장 결과', '수색영장', `${user.name}의 몸을 수색하고자 하였으나, 변호사이기 때문에 수색할 수 없었다.`))
        return self.send(Serialize.PlaySound('result'))
      }
      let itemName = []
      for (const item of user.game.inventory)
        itemName.push(item.name)
      self.send(Serialize.UpdateRoomGameInfo('수색영장 결과', '수색영장', `${user.name}의 몸을 수색해보니, <color=red>${itemName.join(', ')} 등</color>을 갖고 있었다.`))
      return self.send(Serialize.PlaySound('result'))
    }
    self.send(Serialize.InformMessage('<color=red>앞에 대상이 없습니다.</color>'))
  }
}

class authorizationMethod {
  constructor(args = {}) { }

  doing(self, item) {
    const room = Room.get(self.roomId)
    const { events } = room.places[self.place]
    for (const event of events) {
      if (!(self.x === event.x && self.y === event.y || self.x + self.direction.x === event.x && self.y - self.direction.y === event.y))
        continue
      if (!event.detective)
        return self.send(Serialize.InformMessage('<color=red>이용할 수 있는 대상이 아닙니다.</color>'))
      if (event.death < 1)
        return self.send(Serialize.InformMessage('<color=red>대상이 죽은 상태가 아닙니다.</color>'))
      const itemInfo = Item.get(event.death)
      let flag = true
      let message = ''
      switch (itemInfo.type) {
        case DeathType.STRANGULATION:
          message = '목 주변이 부어올라 있다.'
          break
        case DeathType.NECKTIE_STRANGULATION:
          message = '목 주변이 부어올라 있다.'
          break
        case DeathType.BLUNT:
          message = '온몸에 멍이 있다.'
          break
        case DeathType.SLAUGHTER:
          message = '몸에 칼집이 있다.'
          break
        case DeathType.FIRING:
          message = '몸에 탄환이 박혀있다.'
          break
        case DeathType.CROSSBOW:
          message = '몸에 화살이 박혀있다.'
          break
        default:
          flag = false
          break
      }
      self.send(Serialize.UpdateRoomGameInfo('시신 부검 결과', flag ? '의심 정황' : '이상 없음', `${event.name}의 시신을 부검해보니, ${flag ? message : '외관상 특별한 것이 없다.'}`))
      return self.send(Serialize.PlaySound('result'))
    }
    self.send(Serialize.InformMessage('<color=red>앞에 대상이 없습니다.</color>'))
  }
}

class magnifyingMethod {
  constructor(args = {}) { }

  doing(self, item) {
    const room = Room.get(self.roomId)
    const { events } = room.places[self.place]
    for (const event of events) {
      if (!(self.x === event.x && self.y === event.y || self.x + self.direction.x === event.x && self.y - self.direction.y === event.y))
        continue
      if (!event.detective)
        return self.send(Serialize.InformMessage('<color=red>이용할 수 있는 대상이 아닙니다.</color>'))
      if (event.death < 1)
        return self.send(Serialize.InformMessage('<color=red>대상이 죽은 상태가 아닙니다.</color>'))
      const itemInfo = Item.get(event.death)
      let flag = true
      let message = ''
      switch (itemInfo.type) {
        case DeathType.STRANGULATION:
          message = '주변이 흐트러져 있다.'
          break
        case DeathType.NECKTIE_STRANGULATION:
          message = '나일론 실이 흩어져 있다.'
          break
        case DeathType.BLUNT:
          message = '주변이 흐트러져 있다.'
          break
        case DeathType.SLAUGHTER:
          message = '주변이 흐트러져 있다.'
          break
        case DeathType.FIRING:
          message = '탄환이 떨어져 있다.'
          break
        case DeathType.CROSSBOW:
          message = '화살이 떨어져 있다.'
          break
        default:
          flag = false
          break
      }
      self.send(Serialize.UpdateRoomGameInfo('돋보기 판단 결과', flag ? '의심 정황' : '이상 없음', `${event.name}의 시신의 주변을 살펴보니, ${flag ? message : '외관상 별다른 것이 없다.'}`))
      return self.send(Serialize.PlaySound('result'))
    }
    self.send(Serialize.InformMessage('<color=red>앞에 대상이 없습니다.</color>'))
  }
}

class poisonMethod {
  constructor(args = {}) { }

  doing(self, item) {
    const room = Room.get(self.roomId)
    const { events } = room.places[self.place]
    for (const event of events) {
      if (!(self.x === event.x && self.y === event.y || self.x + self.direction.x === event.x && self.y - self.direction.y === event.y))
        continue
      if (!event.detective)
        return self.send(Serialize.InformMessage('<color=red>이용할 수 있는 대상이 아닙니다.</color>'))
      if (event.death < 1)
        return self.send(Serialize.InformMessage('<color=red>대상이 죽은 상태가 아닙니다.</color>'))
      const itemInfo = Item.get(event.death)
      const flag = itemInfo.type === DeathType.POISON
      self.send(Serialize.UpdateRoomGameInfo('독극물 판별 결과', flag ? '의심 정황' : '이상 없음', `어떤 독극물이 쓰였는지 ${event.name}의 시신을 판별해본 결과, ${flag ? itemInfo.name + (pix.maker(itemInfo.name) ? '를' : '을') + ' 쓴 것으로 확인되었다.' : '외관상 별다른 것이 없다.'}`))
      return self.send(Serialize.PlaySound('result'))
    }
    self.send(Serialize.InformMessage('<color=red>앞에 대상이 없습니다.</color>'))
  }
}

class gpsMethod {
  constructor(args = {}) { }

  doing(self, item) {
    const room = Room.get(self.roomId)
    let text = []
    for (const user of room.mode.users)
      text.push(`Map: ${user.place}, X: ${user.x}, Y: ${user.y}
`)
    text.push(`
내 위치 - ${self.place}, X: ${self.x}, Y: ${self.y}`)
    self.send(Serialize.UpdateRoomGameInfo('GPS 추적 결과', 'GPS 기기', text.join('')))
  }
}

class plasticBagMethod {
  constructor(args = {}) { }

  doing(self, item) {
    const room = Room.get(self.roomId)
    const { events } = room.places[self.place]
    for (const event of events) {
      if (!(self.x === event.x && self.y === event.y || self.x + self.direction.x === event.x && self.y - self.direction.y === event.y))
        continue
      if (!event.detective)
        return self.send(Serialize.InformMessage('<color=red>이용할 수 있는 대상이 아닙니다.</color>'))
      if (event.death < 1)
        return self.send(Serialize.InformMessage('<color=red>대상이 죽은 상태가 아닙니다.</color>'))
      event.death = item.id
      event.graphics = `${event.pureGraphics}_D`
      event.publishToMap(Serialize.SetGraphics(event))
      self.send(Serialize.InformMessage('<color=red>살해 현장의 모든 증거를 흔적도 없이 지웠다.</color>'))
      return self.send(Serialize.PlaySound('result'))
    }
    self.send(Serialize.InformMessage('<color=red>앞에 대상이 없습니다.</color>'))
  }
}

class researchMethod {
  constructor(args = {}) { }

  doing(self, item) {
    const room = Room.get(self.roomId)
    const { events } = room.places[self.place]
    for (const event of events) {
      if (!(self.x === event.x && self.y === event.y || self.x + self.direction.x === event.x && self.y - self.direction.y === event.y))
        continue
      if (!event.detective)
        return self.send(Serialize.InformMessage('<color=red>이용할 수 있는 대상이 아닙니다.</color>'))
      if (event.death < 1)
        return self.send(Serialize.InformMessage('<color=red>대상이 죽은 상태가 아닙니다.</color>'))
      const result = event.death === 8
      self.send(Serialize.UpdateRoomGameInfo('정밀 분석기 결과', result ? '증거인멸 확인' : '이상 없음', `${event.name}의 시신을 확인해보니, ${result ? '증거인멸의 흔적이 보인다.' : '아무런 이상이 없는 것으로 판단된다.'}`))
      return self.send(Serialize.PlaySound('result'))
    }
    self.send(Serialize.InformMessage('<color=red>앞에 대상이 없습니다.</color>'))
  }
}

class shamanMethod {
  constructor(args = {}) { }

  doing(self, item) {
    const room = Room.get(self.roomId)
    const { events } = room.places[self.place]
    for (const event of events) {
      if (!(self.x === event.x && self.y === event.y || self.x + self.direction.x === event.x && self.y - self.direction.y === event.y))
        continue
      if (!event.detective)
        return self.send(Serialize.InformMessage('<color=red>이용할 수 있는 대상이 아닙니다.</color>'))
      if (event.death > 0)
        return self.send(Serialize.InformMessage('<color=red>대상이 살은 상태가 아닙니다.</color>'))
      event.target = self
      self.send(Serialize.InformMessage(`<color=red>이제부터 ${event.name} 사망시 당신에게 바로 보고합니다.</color>`))
      return self.send(Serialize.PlaySound('result'))
    }
    self.send(Serialize.InformMessage('<color=red>앞에 대상이 없습니다.</color>'))
  }
}

class positionMethod {
  constructor(args = {}) { }

  doing(self, item) {
    const room = Room.get(self.roomId)
    room.publish(Serialize.NoticeMessage(`${self.name}님의 위치는 Map ${self.place}, X ${self.x}, Y ${self.y} 입니다.`))
  }
}

class iceMethod {
  constructor(args = {}) { }

  doing(self, item) {
    const room = Room.get(self.roomId)
    const { events } = room.places[self.place]
    for (const event of events) {
      if (!(self.x === event.x && self.y === event.y || self.x + self.direction.x === event.x && self.y - self.direction.y === event.y))
        continue
      if (event.name !== '퓨즈')
        return self.send(Serialize.InformMessage('<color=red>퓨즈가 아닙니다.</color>'))
      event.deadCount = 30
      self.send(Serialize.InformMessage(`<color=red>30초 후 퓨즈가 내려갑니다.</color>`))
      return self.send(Serialize.PlaySound('result'))
    }
    self.send(Serialize.InformMessage('<color=red>앞에 대상이 없습니다.</color>'))
  }
}

class recordMethod {
  constructor(args = {}) { }

  doing(self, item) {
    const room = Room.get(self.roomId)
    const array = item.id === 25 ? [1, 3, 4, 5, 7, 9, 11] : [2, 6, 8, 10]
    const pick = Math.floor(Math.random() * array.length)
    room.publish(Serialize.PlaySound(`scream${array[pick]}`))
  }
}

class timerMethod {
  constructor(args = {}) { }

  doing(self, item) {
    const room = Room.get(self.roomId)
    room.mode.deadCount = 40
    room.publish(Serialize.UpdateRoomModeInfo(room.mode))
  }
}

class deathMethod {
  constructor(args = {}) { }

  doing(self, item) {
    const room = Room.get(self.roomId)
    const { events } = room.places[self.place]
    for (const event of events) {
      if (!(self.x === event.x && self.y === event.y || self.x + self.direction.x === event.x && self.y - self.direction.y === event.y))
        continue
      if (!event.detective)
        return self.send(Serialize.InformMessage('<color=red>이용할 수 있는 대상이 아닙니다.</color>'))
      if (event.death < 1)
        return self.send(Serialize.InformMessage('<color=red>대상이 죽은 상태가 아닙니다.</color>'))
      const id = [10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21]
      const pick = Math.random() * id
      event.death = pick
      self.send(Serialize.InformMessage('<color=red>살해 현장의 증거를 조작하였다.</color>'))
      return self.send(Serialize.PlaySound('result'))
    }
    self.send(Serialize.InformMessage('<color=red>앞에 대상이 없습니다.</color>'))
  }
}

class silencerMethod {
  constructor(args = {}) { }

  doing(self, item) {

  }
}

class usePoisonMethod {
  constructor(args = {}) {
    this.timer = args['timer'] || 25
  }

  doing(self, item) {
    const room = Room.get(self.roomId)
    const { events } = room.places[self.place]
    for (const event of events) {
      if (!(self.x === event.x && self.y === event.y || self.x + self.direction.x === event.x && self.y - self.direction.y === event.y))
        continue
      if (!event.detective)
        return self.send(Serialize.InformMessage('<color=red>살해할 수 있는 대상이 아닙니다.</color>'))
      if (event.death > 0)
        return self.send(Serialize.InformMessage('<color=red>대상이 이미 죽었거나 음독 상태입니다.</color>'))
      self.send(Serialize.InformMessage(`<color=red>${event.name}에게 ${item.name}${(pix.maker(item.name) ? '를' : '을')} 강제로 먹였습니다.</color>`))
      self.publishToMap(Serialize.PlaySound('drink'))
      ++self.score.kill
      event.death = item.id
      event.deathCount = this.timer * 10
      return
    }
    self.send(Serialize.InformMessage('<color=red>앞에 대상이 없습니다.</color>'))
  }
}

class weaponMethod {
  constructor(args = {}) {
    this.weaponSound = args['weaponSound'] || ''
  }

  doing(self, item) {
    const room = Room.get(self.roomId)
    const { events } = room.places[self.place]
    for (const event of events) {
      if (!(self.x === event.x && self.y === event.y || self.x + self.direction.x === event.x && self.y - self.direction.y === event.y))
        continue
      if (!event.detective)
        return self.send(Serialize.InformMessage('<color=red>살해할 수 있는 대상이 아닙니다.</color>'))
      if (event.death > 0)
        return self.send(Serialize.InformMessage('<color=red>대상이 이미 죽었거나 음독 상태입니다.</color>'))
      ++room.mode.corpses
      room.mode.deadCount = 40
      self.publish(Serialize.UpdateRoomModeInfo(room.mode))
      self.send(Serialize.InformMessage(`<color=red>${event.name}${(pix.maker(event.name) ? '를' : '을')} ${item.name}${(pix.maker(item.name) ? '로' : '으로')} 죽였습니다.</color>`))
      ++self.score.kill
      event.death = item.id
      if (event.target)
        event.target.send(Serialize.InformMessage(`강령술에 의해 ${event.name} 사망을 확인함.`))
      if (this.weaponSound !== '')
        self.publish(Serialize.PlaySound(this.weaponSound))
      if (item.type === DeathType.STRANGULATION || item.type === DeathType.NECKTIE_STRANGULATION || item.type === DeathType.POISON) {
        self.publishToMap(Serialize.PlaySound('strangulation'))
        event.graphics = `${event.graphics}_D`
      } else {
        self.publish(Serialize.PlaySound(event.deathSound))
        event.graphics = `${event.graphics}_DB`
      }
      return event.publishToMap(Serialize.SetGraphics(event))
    }
    self.send(Serialize.InformMessage('<color=red>앞에 대상이 없습니다.</color>'))
  }
}

module.exports = new Proxy({
  luminor: LuminorMethod,
  gloves: glovesMethod,
  warrant: warrantMethod,
  authorization: authorizationMethod,
  magnifying: magnifyingMethod,
  poison: poisonMethod,
  gps: gpsMethod,
  plasticBag: plasticBagMethod,
  research: researchMethod,
  shaman: shamanMethod,
  position: positionMethod,
  ice: iceMethod,
  record: recordMethod,
  timer: timerMethod,
  death: deathMethod,
  silencer: silencerMethod,
  usePoison: usePoisonMethod,
  weapon: weaponMethod,
}, {
    get: function (target, name) {
      return target.hasOwnProperty(name) ? target[name] : DefaultMethod
    }
  })