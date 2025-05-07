import { GameScreen, GameState, GuessScreenAttributes, Inventory, Player } from "@/types/game/game";
import { RoundCardIdentifier } from "@/types/game/roundcard";

export const loadGameStateFromLocalStorage = (): Partial<GameState> => {
  const gameState = {} as Partial<GameState>;
  const currentRound = localStorage.getItem("currentRound");
  const currentScreen = localStorage.getItem("currentScreen");
  const roundCardSubmitter = localStorage.getItem("roundCardSubmitter");
  const activeRoundCard = localStorage.getItem("activeRoundCard");
  const guessScreenAttributes = localStorage.getItem("guessScreenAttributes");
  const inventory = localStorage.getItem("inventory");
  const players = localStorage.getItem("players");

  gameState.currentRound = currentRound ? parseInt(currentRound) : undefined;
  gameState.currentScreen = currentScreen ? (currentScreen as GameScreen) : undefined;
  gameState.roundCardSubmitter = currentScreen ? (roundCardSubmitter as string) : undefined;
  gameState.activeRoundCard = activeRoundCard ? (activeRoundCard as RoundCardIdentifier) : undefined;
  gameState.guessScreenAttributes = guessScreenAttributes
    ? (JSON.parse(guessScreenAttributes) as GuessScreenAttributes)
    : undefined;
  gameState.inventory = inventory ? (JSON.parse(inventory) as Inventory) : undefined;
  gameState.players = players ? (JSON.parse(players) as Player[]) : undefined;
  return gameState;
};

export const setGameStateToLocalStorage = (state: Partial<GameState>) => {
  console.log("setGameStateToLocalStorage", state);
  const currentRound = state.currentRound;
  const currentScreen = state.currentScreen;
  const roundCardSubmitter = state.roundCardSubmitter;
  const activeRoundCard = state.activeRoundCard;
  const guessScreenAttributes = state.guessScreenAttributes;
  const inventory = state.inventory;
  const players = state.players;
  if (currentRound) {
    localStorage.setItem("currentRound", currentRound.toString());
  }
  if (currentScreen) {
    localStorage.setItem("currentScreen", currentScreen);
  }
  if (roundCardSubmitter) {
    localStorage.setItem("roundCardSubmitter", roundCardSubmitter);
  }
  if (activeRoundCard) {
    localStorage.setItem("activeRoundCard", activeRoundCard);
  }
  if (guessScreenAttributes) {
    localStorage.setItem("guessScreenAttributes", JSON.stringify(guessScreenAttributes));
  }
  if (inventory) {
    localStorage.setItem("inventory", JSON.stringify(inventory));
  }
  if (players) {
    localStorage.setItem("players", JSON.stringify(players));
  }
};
