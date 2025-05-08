"use client";

import { useApi } from "@/hooks/useApi";
import { User } from "@/types/user";
import { usePathname } from "next/navigation";
import { FC, useEffect } from "react";
import { useCallback } from "react";

const LocalStorageHandler: FC<{ children: React.ReactNode }> = ({ children }) => {
  const pathname = usePathname();
  const apiService = useApi();

  //clear relevant local storage entries when navigating away from lobby or game
  useEffect(() => {
    if (!pathname.startsWith("/lobbies/") && !pathname.startsWith("/games/")) {
      localStorage.removeItem("lobbyId");
    }

    if (!pathname.startsWith("/games/")) {
      localStorage.removeItem("gameState");
    }
  }, [pathname]);

  // check if token is still valid, if not, clear local storage
  const checkIfTokenStillValid = useCallback(
    async (token: string) => {
      try {
        const response = await apiService.get<User>("/auth/me", {
          headers: { Authorization: token },
        });
        if (response.token) {
          localStorage.setItem("user", JSON.stringify(response));
        }
      } catch (error) {
        if (error instanceof Error) {
          localStorage.removeItem("user");
          localStorage.removeItem("userAttributes");
          localStorage.removeItem("gameState");
          localStorage.removeItem("lobbyId");

          console.info("Stored token is invalid, please log in again.");
        } else {
          console.error("An unknown error occurred during login.");
        }
      }
    },
    [apiService]
  );

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user") || "null") as User | null;
    if (!user || (user && !user.token)) return;

    checkIfTokenStillValid(user.token);
  }, [checkIfTokenStillValid, pathname]);

  return <>{children}</>;
};

export default LocalStorageHandler;
