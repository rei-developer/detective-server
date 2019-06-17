const {
  TeamType,
  JobsType,
  ModeType
} = require('../library/const')
const ToClient = require('./ToClient')

const my = {}

my.UserData = function (user) {
  const packet = {}
  packet._head = ToClient.USER_DATA
  packet.index = user.index
  packet.id = user.id
  packet.clanname = user.clan && user.clan.name || ''
  packet.name = user.name
  packet.rank = user.rank
  packet.level = user.level
  packet.exp = user.exp
  packet.maxExp = user.maxExp
  packet.coin = user.coin
  packet.cash = user.cash
  packet.escape = user.escape
  packet.kill = user.kill
  packet.death = user.death
  packet.assist = user.assist
  packet.blast = user.blast
  packet.rescue = user.rescue
  packet.survive = user.survive
  packet.graphics = user.graphics
  packet.admin = user.admin
  return JSON.stringify(packet)
}

my.Vibrate = function () {
  const packet = {}
  packet._head = ToClient.VIBRATE
  return JSON.stringify(packet)
}

my.ConnectionCount = function (count) {
  const packet = {}
  packet._head = ToClient.CONNECTION_COUNT
  packet.count = count
  return JSON.stringify(packet)
}

my.SystemMessage = function (message) {
  const packet = {}
  packet._head = ToClient.SYSTEM_MESSAGE
  packet.text = message
  return JSON.stringify(packet)
}

my.InformMessage = function (message) {
  const packet = {}
  packet._head = ToClient.INFORM_MESSAGE
  packet.text = message
  return JSON.stringify(packet)
}

my.NoticeMessage = function (message) {
  const packet = {}
  packet._head = ToClient.NOTICE_MESSAGE
  packet.text = message
  return JSON.stringify(packet)
}

my.ChatMessage = function (type, index, name, text) {
  const packet = {}
  packet._head = ToClient.CHAT_MESSAGE
  packet.type = type
  packet.index = index
  packet.name = name
  packet.text = text
  return JSON.stringify(packet)
}

my.Portal = function (place, x, y, dir) {
  const packet = {}
  packet._head = ToClient.PORTAL
  packet.place = place
  packet.x = x
  packet.y = y
  packet.dir = dir
  return JSON.stringify(packet)
}

my.RemoveGameObject = function (obj) {
  const packet = {}
  packet._head = ToClient.REMOVE_GAME_OBJECT
  packet.type = obj.type
  packet.index = obj.index;
  return JSON.stringify(packet)
}

my.CreateGameObject = function (obj, hide = false) {
  const packet = {}
  packet._head = ToClient.CREATE_GAME_OBJECT
  packet.index = obj.index
  packet.clanname = hide ? '' : (obj.clan && obj.clan.name || '')
  packet.type = obj.type
  packet.name = hide ? '' : obj.name
  packet.no = obj.roomUserNo
  packet.team = (obj.hasOwnProperty('game') && obj.game.hasOwnProperty('team')) ? obj.game.team : TeamType.CITIZEN
  packet.graphics = obj.graphics
  packet.x = obj.x
  packet.y = obj.y
  packet.dir = obj.direction
  packet.collider = obj.collider
  return JSON.stringify(packet)
}

my.SetGraphics = function (obj) {
  const packet = {}
  packet._head = ToClient.SET_GRAPHICS
  packet.type = obj.type
  packet.index = obj.index
  packet.graphics = obj.graphics
  return JSON.stringify(packet)
}

my.PlaySound = function (name) {
  const packet = {}
  packet._head = ToClient.PLAY_SOUND
  packet.name = name
  return JSON.stringify(packet)
}

my.GetRoomUser = function (users = []) {
  const packet = {}
  packet._head = ToClient.GET_ROOM_USER
  packet.users = users.map(i => ({
    index: i.index,
    name: `[${i.roomUserNo}] ${i.name}`
  }))
  return JSON.stringify(packet)
}

my.AddRoomUser = function (user) {
  const packet = {}
  packet._head = ToClient.ADD_ROOM_USER
  packet.index = user.index
  packet.name = `[${user.roomUserNo}] ${user.name}`
  return JSON.stringify(packet)
}

my.RemoveRoomUser = function (index) {
  const packet = {}
  packet._head = ToClient.REMOVE_ROOM_USER
  packet.index = index
  return JSON.stringify(packet)
}

my.UpdateRoomModeInfo = function (mode) {
  const packet = {}
  packet._head = ToClient.UPDATE_ROOM_MODE_INFO
  packet.type = mode.type
  switch (mode.type) {
    case ModeType.DETECTIVE:
      packet.deadCount = mode.deadCount
      break
  }
  return JSON.stringify(packet)
}

my.UpdateRoomGameInfo = function (label, title, description) {
  const packet = {}
  packet._head = ToClient.UPDATE_ROOM_GAME_INFO
  packet.label = label
  packet.title = title
  packet.description = description
  return JSON.stringify(packet)
}

my.SetGameNo = function (obj) {
  const packet = {}
  packet._head = ToClient.SET_GAME_NO
  packet.no = obj.roomUserNo
  return JSON.stringify(packet)
}

my.SetGameTeam = function (obj) {
  const packet = {}
  packet._head = ToClient.SET_GAME_TEAM
  packet.type = obj.type
  packet.index = obj.index
  packet.team = (obj.hasOwnProperty('game') && obj.game.hasOwnProperty('team')) ? obj.game.team : TeamType.CITIZEN
  return JSON.stringify(packet)
}

my.SetGameJobs = function (obj) {
  const packet = {}
  packet._head = ToClient.SET_GAME_JOBS
  packet.type = obj.type
  packet.index = obj.index
  packet.jobs = (obj.hasOwnProperty('game') && obj.game.hasOwnProperty('jobs')) ? obj.game.jobs : JobsType.EMPLOYEE
  return JSON.stringify(packet)
}

my.SetGameStatus = function (obj) {
  const packet = {}
  packet._head = ToClient.SET_GAME_STATUS
  packet.status = (obj.hasOwnProperty('game') && obj.game.hasOwnProperty('status')) ? obj.game.status.map(item => ({ item })) : false
  return JSON.stringify(packet)
}

my.ModeData = function (mode) {
  const packet = {}
  packet._head = ToClient.MODE_DATA
  packet.type = mode.type
  // packet.count = mode.count
  // packet.maxCount = mode.maxCount
  return JSON.stringify(packet)
}

my.GetClan = function (clan, members = []) {
  const packet = {}
  packet._head = ToClient.GET_CLAN
  packet.hasClan = !!clan
  if (packet.hasClan) {
    packet.name = clan.name
    packet.level = clan.level
    packet.exp = clan.exp
    packet.masterId = clan.masterId
    packet.members = members.map(m => ({
      id: m.id,
      name: m.name,
      level: m.level
    }))
  }
  return JSON.stringify(packet)
}

my.InviteClan = function (invites) {
  const packet = {}
  packet._head = ToClient.INVITE_CLAN
  packet.invites = invites
  return JSON.stringify(packet)
}

my.AddItem = function (self, item = []) {
  const packet = {}
  packet._head = ToClient.ADD_ITEM
  packet.index = item.index
  packet.id = item.id
  packet.num = item.num
  packet.icon = item.icon
  packet.name = item.name
  packet.description = item.description
  packet.jobs = item.jobs ? (item.jobs.indexOf(self.game.jobs) < 0 ? false : true) : true,
    packet.killer = item.killer
  return JSON.stringify(packet)
}

my.SetUpItem = function (item = []) {
  const packet = {}
  packet._head = ToClient.SET_UP_ITEM
  packet.index = item.index
  packet.num = item.num
  return JSON.stringify(packet)
}

my.UseItem = function (index) {
  const packet = {}
  packet._head = ToClient.USE_ITEM
  packet.index = index
  return JSON.stringify(packet)
}

my.RemoveItem = function (index) {
  const packet = {}
  packet._head = ToClient.REMOVE_ITEM
  packet.index = index
  return JSON.stringify(packet)
}

my.GetTrash = function (self, trash = [], trashUsers = []) {
  const packet = {}
  packet._head = ToClient.GET_TRASH
  packet.trash = trash.map(i => ({
    index: i.index,
    id: i.id,
    num: i.num,
    icon: i.icon,
    name: i.name,
    description: i.description,
    jobs: i.jobs ? (i.jobs.indexOf(self.game.jobs) < 0 ? false : true) : true,
    killer: i.killer
  }))
  packet.trashUsers = trashUsers.map(i => ({
    index: i.index,
    name: i.name,
    no: i.roomUserNo
  }))
  return JSON.stringify(packet)
}

my.AddTrash = function (self, trash = []) {
  const packet = {}
  packet._head = ToClient.ADD_TRASH
  packet.index = trash.index
  packet.id = trash.id
  packet.num = trash.num
  packet.icon = trash.icon
  packet.name = trash.name
  packet.description = trash.description
  packet.jobs = trash.jobs ? (trash.jobs.indexOf(self.game.jobs) < 0 ? false : true) : true,
    packet.killer = trash.killer
  return JSON.stringify(packet)
}

my.RemoveTrash = function (index) {
  const packet = {}
  packet._head = ToClient.REMOVE_TRASH
  packet.index = index
  return JSON.stringify(packet)
}

my.AddUserTrash = function (user, count) {
  const packet = {}
  packet._head = ToClient.ADD_USER_TRASH
  packet.index = user.index
  packet.name = user.name
  packet.no = user.roomUserNo
  packet.count = count
  return JSON.stringify(packet)
}

my.RemoveUserTrash = function (index, count) {
  const packet = {}
  packet._head = ToClient.REMOVE_USER_TRASH
  packet.index = index
  packet.count = count
  return JSON.stringify(packet)
}

my.GetVote = function (users = []) {
  const packet = {}
  packet._head = ToClient.GET_VOTE
  packet.users = users.map(i => ({
    index: i.index,
    name: i.name,
    no: i.roomUserNo
  }))
  return JSON.stringify(packet)
}

my.SetUpVote = function (user) {
  const packet = {}
  packet._head = ToClient.SET_UP_VOTE
  packet.index = user.index
  packet.pointed = (user.hasOwnProperty('game') && user.game.hasOwnProperty('pointed')) ? user.game.pointed : 0
  return JSON.stringify(packet)
}

my.CloseVote = function () {
  const packet = {}
  packet._head = ToClient.CLOSE_VOTE
  return JSON.stringify(packet)
}

my.SetUpUserLikes = function (index, likes) {
  const packet = {}
  packet._head = ToClient.SET_UP_USER_LIKES
  packet.index = index
  packet.likes = likes
  return JSON.stringify(packet)
}

my.DeadAnimation = function () {
  const packet = {}
  packet._head = ToClient.DEAD_ANIMATION
  return JSON.stringify(packet)
}

my.ResultGame = function (ending, users) {
  const packet = {}
  packet._head = ToClient.RESULT_GAME
  packet.ending = ending
  packet.users = users.map(i => ({
    index: i.index,
    rank: users.indexOf(i) + 1,
    name: i.name,
    team: i.game.team,
    jobs: i.game.jobs,
    rp: i.reward.exp
  }))
  return JSON.stringify(packet)
}

my.EnterWardrobe = function () {
  const packet = {}
  packet._head = ToClient.ENTER_WARDROBE
  return JSON.stringify(packet)
}

my.LeaveWardrobe = function () {
  const packet = {}
  packet._head = ToClient.LEAVE_WARDROBE
  return JSON.stringify(packet)
}

my.SwitchFuse = function (obj, active) {
  const packet = {}
  packet._head = ToClient.SWITCH_FUSE
  packet.team = (obj.hasOwnProperty('game') && obj.game.hasOwnProperty('team')) ? obj.game.team : TeamType.CITIZEN
  packet.active = active
  return JSON.stringify(packet)
}

my.SwitchLight = function (active) {
  const packet = {}
  packet._head = ToClient.SWITCH_LIGHT
  packet.active = active
  return JSON.stringify(packet)
}

my.QuitGame = function () {
  const packet = {}
  packet._head = ToClient.QUIT_GAME
  return JSON.stringify(packet)
}

my.TempSkinBuy = function (graphics, coin) {
  const packet = {}
  packet._head = ToClient.TEMP_SKIN_BUY
  packet.graphics = graphics
  packet.coin = coin
  return JSON.stringify(packet)
}

module.exports = {
  ...my
}