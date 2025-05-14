export interface User {
  userid: number;
  username: string;
  email: string;
  token: string;
  statsPublic: boolean;
}

export interface UserAttributes {
  xp: number;
  gamesPlayed: number;
  wins: number;
  points: number;
}

export interface PublicUser {
  username: string;
}

export interface PublicUserAttributes {
  xp: number;
  gamesPlayed: number;
  wins: number;
  points: number;
}
