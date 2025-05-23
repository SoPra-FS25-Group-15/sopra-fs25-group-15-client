import { ActionCardIdentifier } from "./actioncard";
import { RoundCardIdentifier } from "./roundcard";

export type GameScreen = "ROUNDCARD" | "ACTIONCARD" | "GUESS" | "REVEAL";

export interface GameState {
  currentRound: number;
  currentScreen: GameScreen;
  roundCardSubmitter: string;
  activeRoundCard: RoundCardIdentifier;
  guessScreenAttributes: GuessScreenAttributes;
  inventory: Inventory;
  players: Player[];
}

export interface Inventory {
  roundCards: RoundCardIdentifier[];
  actionCards: ActionCardIdentifier[];
}

export interface Player {
  username: string;
  roundCardsLeft: number;
  actionCardsLeft: number;
  activeActionCards: ActionCardIdentifier[];
}

export interface GuessScreenAttributes {
  time: number;
  guessLocation: {
    lat: number;
    lon: number;
  };
}

export interface GameRecord {
  winner: string;
  players: string[];
  roundsPlayed: number;
  roundCardStartAmount: number;
  startedAt: Date;
  completedAt: Date;
}
