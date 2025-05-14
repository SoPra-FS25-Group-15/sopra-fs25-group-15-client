"use client";

import { useApi } from "@/hooks/useApi";
import { User, UserAttributes } from "@/types/user";
import { usePathname } from "next/navigation";
import { FC, useEffect } from "react";
import { useCallback } from "react";
import { useGlobalUser } from "./globalUser";
import { useGlobalUserAttributes } from "./globalUserAttributes";

const LocalStorageHandler: FC<{ children: React.ReactNode }> = ({ children }) => {
  const pathname = usePathname();
  const apiService = useApi();
  const { user } = useGlobalUser();
  const { userAttributes } = useGlobalUserAttributes();

  //clear relevant local storage entries when navigating away from lobby or game
  useEffect(() => {
    if (!pathname.startsWith("/lobbies/") && !pathname.startsWith("/games/")) {
      localStorage.removeItem("lobbyId");
    }

    if (!pathname.startsWith("/games/")) {
      localStorage.removeItem("gameState");
      window.dispatchEvent(new Event("gameStateChanged"));
    }
  }, [pathname]);

  // check if token is still valid, if not, clear local storage
  const validateAuthToken = useCallback(async () => {
    if (!user || (user && !user.token)) return;

    try {
      const response = await apiService.get<User>("/auth/me", {
        headers: { Authorization: user.token },
      });

      if (JSON.stringify(response) !== JSON.stringify(user)) {
        localStorage.setItem("user", JSON.stringify(response));
        window.dispatchEvent(new Event("userChanged"));
      }
    } catch (error) {
      if (error instanceof Error) {
        localStorage.clear();
        window.dispatchEvent(new Event("userChanged"));
        window.dispatchEvent(new Event("userAttributesChanged"));
        window.dispatchEvent(new Event("gameStateChanged"));
        console.info("Stored token is invalid, please log in again.");
      } else {
        console.error("An unknown error occurred during checking token validity", error);
      }
    }
  }, [apiService, user]);

  // fetch user attributes like xp and stats
  const fetchUserAttributes = useCallback(async () => {
    if (!user || (user && !user.token)) return;

    try {
      const response = await apiService.get<UserAttributes>("/users/me/stats", {
        headers: { Authorization: user.token },
      });

      if (JSON.stringify(response) !== JSON.stringify(userAttributes)) {
        localStorage.setItem("userAttributes", JSON.stringify(response));
        window.dispatchEvent(new Event("userAttributesChanged"));
      }
    } catch (error) {
      console.error("An error occurred while fetching user attributes", error);
    }
  }, [apiService, user, userAttributes]);

  useEffect(() => {
    if (!user?.token) return;

    validateAuthToken();
    fetchUserAttributes();
  }, [user?.token, validateAuthToken, fetchUserAttributes]);

  return <>{children}</>;
};

export default LocalStorageHandler;
