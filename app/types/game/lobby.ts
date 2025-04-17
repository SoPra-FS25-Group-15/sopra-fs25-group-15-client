export interface LobbyManagement {
  currentLobbyCode: string;
  pendingInvites: {
    username: string;
    lobbyCode: string;
  }[];
}

export interface Lobby {
  code: string;
  maxPlayers: string;
  playersPerTeam: string;
  roundCardsStartAmount: string;
}
