export interface User {
  username: string;
  email: string;
  token: string;
  online: boolean;
}
export interface PublicUser {
  username: string;
}

export interface UserAttributes {
  xp: number;
  gamesPlayed: number;
  wins: number;
  points: number;
}
