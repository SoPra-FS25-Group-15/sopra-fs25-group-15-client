"use client";

import { User } from "@/types/user";
import { createContext, useContext, useState, ReactNode, useEffect } from "react";

type GlobalStateType = {
  user: User | null;
};

const GlobalUserContext = createContext<GlobalStateType | undefined>(undefined);

export function GlobalUserProvider({ children }: { children: ReactNode }) {
  const [globalUser, setGlobalUser] = useState<User | null>(null);

  useEffect(() => {
    // Update the user from local storage when the component mounts
    const updateUser = () => {
      const stored = window.localStorage.getItem("user");
      if (stored) {
        setGlobalUser(JSON.parse(stored) as User | null);
        console.log("Global User updated:", JSON.parse(stored) as User | null);
      } else {
        setGlobalUser(null);
        console.log("Global User updated:", null);
      }
    };

    // Initial update
    updateUser();

    // Listen for changes from other windows/tabs
    const handleExternal = (event: StorageEvent) => {
      if (event.key === "user") {
        updateUser();
      }
    };

    // Listen for changes in the SAME tab via a custom event.
    // Call window.dispatchEvent(new Event("userChanged")) whenever you update localStorage in the same tab.
    const handleInternal = () => {
      updateUser();
    };

    window.addEventListener("storage", handleExternal);
    window.addEventListener("userChanged", handleInternal);

    // Cleanup the event listeners on unmount
    return () => {
      window.removeEventListener("storage", handleExternal);
      window.removeEventListener("userChanged", handleInternal);
    };
  }, []);

  return <GlobalUserContext.Provider value={{ user: globalUser }}>{children}</GlobalUserContext.Provider>;
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
