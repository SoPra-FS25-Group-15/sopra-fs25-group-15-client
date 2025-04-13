"use client";

import { User } from "@/types/user";
import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode
} from "react";

type GlobalStateType = {
  user: User | null;
  setUser: (u: User | null) => void;
};

const GlobalUserContext = createContext<GlobalStateType | undefined>(undefined);

export function GlobalUserProvider({ children }: { children: ReactNode }) {
  const [globalUser, setGlobalUser] = useState<User | null>(null);

  // Helper to read user from localStorage:
  function loadUserFromLocalStorage(): User | null {
    const stored = window.localStorage.getItem("user");
    if (stored) {
      try {
        return JSON.parse(stored) as User;
      } catch {
        console.warn("Failed to parse stored user");
        return null;
      }
    }
    return null;
  }

  // Sync globalUser with localStorage:
  const updateUser = () => {
    const userFromStorage = loadUserFromLocalStorage();
    setGlobalUser(userFromStorage);
    console.log("GlobalUser updated:", userFromStorage);
  };

  useEffect(() => {
    // Initial load
    updateUser();

    // Listen for changes in other tabs/windows
    const handleExternalStorage = (event: StorageEvent) => {
      if (event.key === "user") {
        updateUser();
      }
    };

    // Listen for changes in the same tab (you can dispatch a custom event when you update localStorage)
    const handleInternalUpdate = () => {
      updateUser();
    };

    window.addEventListener("storage", handleExternalStorage);
    window.addEventListener("userChanged", handleInternalUpdate);

    return () => {
      window.removeEventListener("storage", handleExternalStorage);
      window.removeEventListener("userChanged", handleInternalUpdate);
    };
  }, []);

  // Wrap a function to set user and also store in localStorage
  // (or remove from localStorage if user is null).
  const setUser = (user: User | null) => {
    if (user) {
      localStorage.setItem("user", JSON.stringify(user));
    } else {
      localStorage.removeItem("user");
    }
    // If you want other components in the same tab to react, dispatch a custom event:
    window.dispatchEvent(new Event("userChanged"));
    setGlobalUser(user);
  };

  return (
    <GlobalUserContext.Provider value={{ user: globalUser, setUser }}>
      {children}
    </GlobalUserContext.Provider>
  );
}

/**
 * Retrieves the global user context.
 *
 * @returns {GlobalStateType} An object containing:
 *  - user: The current user or null.
 *  - setUser: A function to update the global user or set them to null.
 */
export function useGlobalUser(): GlobalStateType {
  const context = useContext(GlobalUserContext);
  if (!context) {
    throw new Error("useGlobalUser must be used within a GlobalUserProvider");
  }
  return context;
}
