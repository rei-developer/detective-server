const Methods = require('./Methods')

global.Item = (function () {
  const _static = {
    items: {},
  }

  return class Item {
    static get items() {
      return _static.items
    }
    
    static get(id) {
      return Item.items[id]
    }
    
    constructor(id = 1, type = 0, num = 1, maxNum = 1, icon = '', name = '', description = '', jobs = false, killer = false, use = false, method = { command: '', arguments: {} }) {
      this.id = id
      this.type = type
      this.num = num
      this.maxNum = maxNum
      this.icon = icon
      this.name = name
      this.description = description
      this.jobs = jobs
      this.killer = killer
      this.use = use
      this.method = new Methods[method.command](method.arguments)
    }

    doing(self) {
      this.method.doing(self, this)
    }
  }
})()