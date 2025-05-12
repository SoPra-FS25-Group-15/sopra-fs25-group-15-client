"use client";

import { UserAttributes } from "@/types/user";
import { createContext, useContext, useState, ReactNode, useEffect } from "react";

type GlobalStateType = {
  userAttributes: UserAttributes | null;
};

const GlobalUserAttributesContext = createContext<GlobalStateType | undefined>(undefined);

export function GlobalUserAttributesProvider({ children }: { children: ReactNode }) {
  const [globalUserAttributes, setGlobalUserAttributes] = useState<UserAttributes | null>(null);

  useEffect(() => {
    // Update the user from local storage when the component mounts
    const update = () => {
      const stored = window.localStorage.getItem("userAttributes");
      if (stored) {
        setGlobalUserAttributes(JSON.parse(stored) as UserAttributes | null);
        console.log("Global UserAttributes updated:", JSON.parse(stored) as UserAttributes | null);
      } else {
        setGlobalUserAttributes(null);
        console.log("Global UserAttributes updated:", null);
      }
    };

    // Initial update
    update();

    // Listen for changes from other windows/tabs
    const handleExternal = (event: StorageEvent) => {
      if (event.key === "userAttributes") {
        update();
      }
    };

    // Listen for changes in the SAME tab via a custom event.
    // Call window.dispatchEvent(new Event("userChanged")) whenever
    // you update localStorage via useLocalStorage() in the same tab.
    const handleInternal = () => {
      update();
    };

    window.addEventListener("storage", handleExternal);
    window.addEventListener("userAttributesChanged", handleInternal);

    // Cleanup the event listeners on unmount
    return () => {
      window.removeEventListener("storage", handleExternal);
      window.removeEventListener("userAttributesChanged", handleInternal);
    };
  }, []);

  return (
    <GlobalUserAttributesContext.Provider value={{ userAttributes: globalUserAttributes }}>
      {children}
    </GlobalUserAttributesContext.Provider>
  );
}

export function useGlobalUserAttributes(): GlobalStateType {
  const context = useContext(GlobalUserAttributesContext);
  if (!context) {
    throw new Error("useGlobalUserAttributes must be used within a GlobalUserAttributesProvider");
  }
  return context;
}
