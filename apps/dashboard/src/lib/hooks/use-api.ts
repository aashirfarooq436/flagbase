"use client";

import { useContext } from "react";

import type { ApiClient } from "../api";
import { ApiContext } from "../providers/api.provider";

/** Reads the ApiClient from context. Throws if used outside an ApiProvider. */
export function useApi(): ApiClient {
  const client = useContext(ApiContext);
  if (client === null) {
    throw new Error("useApi must be used within an ApiProvider.");
  }
  return client;
}
