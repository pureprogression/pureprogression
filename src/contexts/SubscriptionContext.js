"use client";

import { createContext, useContext } from "react";
import { useSubscriptionState } from "@/hooks/useSubscriptionState";

const SubscriptionContext = createContext(null);

export function SubscriptionProvider({ children }) {
  const value = useSubscriptionState();
  return (
    <SubscriptionContext.Provider value={value}>
      {children}
    </SubscriptionContext.Provider>
  );
}

export function useSubscription() {
  const context = useContext(SubscriptionContext);
  if (!context) {
    throw new Error("useSubscription must be used within SubscriptionProvider");
  }
  return context;
}
