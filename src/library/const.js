const TeamType = {
  KILLER: 0,
  CITIZEN: 1
}

const JobsType = {
  DOCTOR: 0,
  POLICE: 1,
  DETECTIVE: 2,
  STUDENT: 3,
  JOBLESS: 4,
  HOUSEWIFE: 5,
  SOLDIER: 6,
  EMPLOYEE: 7
}

const RoomType = {
  PLAYGROUND: 1,
  GAME: 2,
}

const MapType = {
  ISLAND: 1
}

const ModeType = {
  PLAYGROUND: 1,
  DETECTIVE: 2
}

const StatusType = {
  BLOOD: 1,
  WASHED_BLOOD: 2,
  MUD: 3,
  DUST: 4
}

const DeathType = {
  UNKNOWN: 0,
  STRANGULATION: 1,
  NECKTIE_STRANGULATION: 2,
  BLUNT: 3,
  SLAUGHTER: 4,
  FIRING: 5,
  CROSSBOW: 6,
  POISON: 7
}

const EndingType = {
  KILLER: 0,
  CITIZEN: 1,
  DRAW: 2
}

module.exports = {
  TeamType,
  JobsType,
  RoomType,
  MapType,
  ModeType,
  StatusType,
  DeathType,
  EndingType
}