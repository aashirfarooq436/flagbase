"use client";

import { Toaster } from "@flagbase/ui/components/sonner";

import { ThemeProvider } from "next-themes";
import { type ReactNode } from "react";

import { ApiProvider } from "./api.provider";
import { QueryProvider } from "./query.provider";

/**
 * Every app-runtime provider, composed. Mounted once in `(pages)/layout.tsx` so the whole app
 * shares one provider tree and a future top-level route group can bring its own.
 */
export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <QueryProvider>
        <ApiProvider>
          {children}
          <Toaster richColors position="top-right" />
        </ApiProvider>
      </QueryProvider>
    </ThemeProvider>
  );
}
