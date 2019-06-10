const { ENUM } = require('../library/pix')

module.exports = {
  ...ENUM(
    'USER_DATA',
    'VIBRATE',
    'CONNECTION_COUNT',
    'SYSTEM_MESSAGE',
    'INFORM_MESSAGE',
    'NOTICE_MESSAGE',
    'CHAT_MESSAGE',
    'PORTAL',
    'CREATE_GAME_OBJECT',
    'REMOVE_GAME_OBJECT',
    'SET_GRAPHICS',
    'PLAY_SOUND',
    'UPDATE_ROOM_USER_COUNT',
    'UPDATE_ROOM_MODE_INFO',
    'UPDATE_ROOM_GAME_INFO',
    'SET_GAME_NO',
    'SET_GAME_TEAM',
    'SET_GAME_JOBS',
    'SET_GAME_STATUS',
    'MODE_DATA',
    'GET_CLAN',
    'INVITE_CLAN',
    'ADD_ITEM',
    'SET_UP_ITEM',
    'USE_ITEM',
    'REMOVE_ITEM',
    'GET_TRASH',
    'ADD_TRASH',
    'REMOVE_TRASH',
    'ADD_USER_TRASH',
    'REMOVE_USER_TRASH',
    'GET_VOTE',
    'SET_UP_VOTE',
    'CLOSE_VOTE',
    'SET_UP_USER_LIKES',
    'DEAD_ANIMATION',
    'RESULT_GAME',
    'ENTER_WARDROBE',
    'LEAVE_WARDROBE',
    'SWITCH_FUSE',
    'SWITCH_LIGHT',
    'QUIT_GAME',
    'TEMP_SKIN_BUY'
  )
}