const Actions = require('./Actions')
const Character = require('./Character')

module.exports = class Event extends Character {
  constructor(roomId, {
    name,
    graphics,
    place,
    x,
    y,
    collider,
    detective,
    deathSound,
    action
  } = {
      name: '',
      graphics: '',
      place: 0,
      x: 0,
      y: 0,
      collider: false,
      detective: false,
      deathSound: '',
      action: { command: '', arguments: {} }
    }) {
    super()
    this.type = 2
    this.index = 0
    this.roomId = roomId
    this.name = name
    this.graphics = graphics
    this.pureGraphics = graphics
    this.place = place
    this.x = x
    this.y = y
    this.collider = collider
    this.detective = detective
    this.death = false
    this.deathCount = 0
    this.deathSound = deathSound
    this.action = new Actions[action.command](action.arguments)
  }

  doing(self) {
    this.action.doing(self, this)
  }

  update() {
    this.action.update && this.action.update(this)
  }

  getJSON() {
    return {
      index: this.index,
      type: this.type,
      name: this.name,
      place: this.place,
      movement: {
        x: this.x,
        y: this.y,
        direction: this.direction
      },
      graphics: this.graphics,
      coll: this.collider
    }
  }

  getIndex() {
    return {
      index: this.index,
      type: this.type
    }
  }

  getMovement() {
    return {
      index: this.index,
      type: this.type,
      movement: {
        x: this.x,
        y: this.y,
        direction: this.direction
      }
    }
  }

  turn(x, y) {
    super.turn(x, y)
  }

  move(x, y) {
    super.turn(x, y)
    super.move(x, y)
  }

  publish(data) {
    Room.get(this.roomId).publish(data)
  }

  publishToMap(data) {
    Room.get(this.roomId).publishToMap(this.place, data)
  }
}