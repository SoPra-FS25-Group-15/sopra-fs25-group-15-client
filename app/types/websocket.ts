// src/types/websocket.ts

export interface UserPublicDTO {
    userid: number;        // matches the backend payload
    username: string;
    // other fields your backend includes (mmr, points, email, etc.) can go here:
    mmr?: number;
    points?: number;
    email?: string;
  }
  
  export interface LobbyStatusPayload {
    lobbyId: number;
    code: string;
    host: UserPublicDTO;
    mode: string;
    maxPlayers: string;
    playersPerTeam: number;
    roundCardsStartAmount: number;
    private: boolean;
    status: string;
    players: UserPublicDTO[];
  }
  