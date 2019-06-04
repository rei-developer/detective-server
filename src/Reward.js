module.exports = class Reward {
  constructor() {
    this.init()
  }

  init() {
    this.exp = 0
    this.coin = 0
  }

  send(self) {
    self.setUpExp(Math.floor(this.exp))
    self.coin += Math.floor(this.coin)
    this.init()
  }
}