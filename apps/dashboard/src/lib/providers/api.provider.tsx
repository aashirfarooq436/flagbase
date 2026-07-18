"use client";

import { createContext, type ReactNode, useState } from "react";

import { ApiClient } from "../api";

/** Holds the ApiClient instance. Read via `useApi()` (lib/hooks). */
export const ApiContext = createContext<ApiClient | null>(null);

/**
 * Provides a single ApiClient to the tree. Injecting it (rather than importing a module
 * singleton) is what lets a test swap in a fake client.
 */
export function ApiProvider({ children }: { children: ReactNode }) {
  const [client] = useState(() => new ApiClient());
  return <ApiContext.Provider value={client}>{children}</ApiContext.Provider>;
}
