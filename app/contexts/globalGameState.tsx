"use client";

import { GameState } from "@/types/game/game";
import { createContext, ReactNode, useContext, useEffect, useState } from "react";

type GlobalGameStateType = {
  gameState: Partial<GameState> | null;
};

const GlobalGameStateContext = createContext<GlobalGameStateType | undefined>(undefined);

export function GlobalGameStateProvider({ children }: { children: ReactNode }) {
  const [globalGameState, setGlobalGameState] = useState<Partial<GameState> | null>(null);

  useEffect(() => {
    const update = () => {
      const stored = window.localStorage.getItem("gameState");
      if (stored) {
        const parsed = JSON.parse(stored) as Partial<GameState>;
        setGlobalGameState(parsed);
        console.log("Global GameState updated:", parsed);
      } else {
        setGlobalGameState(null);
        console.log("Global GameState updated:", null);
      }
    };

    // initial load
    update();

    // external tabs/windows
    const handleExternal = (e: StorageEvent) => {
      if (e.key === "gameState") {
        update();
      }
    };
    // same-tab updates
    const handleInternal = () => update();

    window.addEventListener("storage", handleExternal);
    window.addEventListener("gameStateChanged", handleInternal);

    return () => {
      window.removeEventListener("storage", handleExternal);
      window.removeEventListener("gameStateChanged", handleInternal);
    };
  }, []);

  return (
    <GlobalGameStateContext.Provider value={{ gameState: globalGameState }}>{children}</GlobalGameStateContext.Provider>
  );
}

export function useGlobalGameState(): GlobalGameStateType {
  const ctx = useContext(GlobalGameStateContext);
  if (!ctx) {
    throw new Error("useGlobalGameState must be used within a GlobalGameStateProvider");
  }
  return ctx;
}
