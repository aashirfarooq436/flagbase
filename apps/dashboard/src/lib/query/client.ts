import { QueryClient } from "@tanstack/react-query";

/**
 * Builds a QueryClient with the app's defaults. A factory (not a shared singleton) so each
 * browser session — and each test — gets its own isolated cache.
 */
export function makeQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60_000,
        retry: 1,
        refetchOnWindowFocus: false,
      },
    },
  });
}
