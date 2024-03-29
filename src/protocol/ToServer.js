const { ENUM } = require('../library/pix')

module.exports = {
  ...ENUM(
    'HELLO',
    'INPUT_ARROW',
    'INPUT_HIT',
    'ENTER_ROOM',
    'REWARD',
    'ESCAPE',
    'CHAT',
    'CREATE_CLAN',
    'DELETE_CLAN',
    'GET_CLAN',
    'LEAVE_CLAN',
    'INVITE_CLAN',
    'CANCEL_CLAN',
    'JOIN_CLAN',
    'KICK_CLAN',
    'USE_ITEM',
    'DROP_ITEM',
    'PICK_UP_TRASH',
    'LEAVE_TRASH',
    'SELECT_VOTE',
    'SET_UP_USER_LIKES',
    'TEMP_SKIN_BUY',
    'LOGGER'
  )
}