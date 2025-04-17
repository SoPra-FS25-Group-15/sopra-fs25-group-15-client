export interface User {
  username: string;
  email: string;
  token: string;
  online: boolean;
}
export interface PublicUser {
  username: string;
  online: boolean;
}

export interface UserAttributes {
  mmr: number;
  points: number;
  stats: {
    casual: Stats;
    competitive: Stats;
  };
  achievementProgress: {
    id: number;
  }[];
  shopUnlocks: {
    id: boolean;
  }[];
}

export interface PublicUserAttributes {
  mmr: number;
  stats: {
    casual: Stats;
    competitive: Stats;
  };
  achievementProgress: {
    id: number;
  }[];
}

export interface UserSettings {
  selectedTheme: string;
}

export interface Stats {
  games: {
    played: number;
    won: number;
  };
  rounds: {
    played: number;
    won: number;
  };
  cards: {
    round: number;
    powerup: number;
    punishment: number;
  };
  roundsLostAgainst: {
    username: number;
  }[];
}

export interface Achievement {
  id: number;
  title: string;
  description: string;
  maxProgress: number;
}

export interface Theme {
  id: string;
  title: string;
  price: number;
  hexcolor: string;
}
