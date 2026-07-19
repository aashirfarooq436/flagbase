"use client";

import type { UserResponse } from "@flagbase/contracts";
import { Button } from "@flagbase/ui/components/button";

import { skipToken, useQuery } from "@tanstack/react-query";
import { Bug, X } from "lucide-react";
import { usePathname } from "next/navigation";
import { useTheme } from "next-themes";
import { useState } from "react";

import { authKeys } from "@/lib/query";
import { useUiStore } from "@/lib/store/ui.store";

/**
 * A floating, development-only inspector. Shows the authed user, the Zustand UI store, the
 * current route, and theme — so you can eyeball client state without digging through the
 * browser's storage/React-devtools. Mounted only in development (see (pages)/layout.tsx), so
 * it never ships to production.
 */
export function DevPanel() {
  const [open, setOpen] = useState(false);

  // Observe the cached session WITHOUT fetching — the dev panel must be side-effect-free, so it
  // never triggers a /users/me request (which would 401 on the signed-out sign-in/up pages).
  // On authed pages the topbar's useUser populates this cache and the panel reflects it.
  const { data: user, status } = useQuery<UserResponse>({
    queryKey: authKeys.me,
    queryFn: skipToken,
  });
  const uiStore = useUiStore();
  const pathname = usePathname();
  const { theme, resolvedTheme } = useTheme();

  const sections: { label: string; value: unknown }[] = [
    { label: "Session", value: { status, user: user ?? null } },
    { label: "Route", value: { pathname } },
    { label: "Theme", value: { theme, resolvedTheme } },
    { label: "UI store", value: uiStore },
  ];

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="bg-card hover:bg-accent fixed right-4 bottom-4 z-50 flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium shadow-lg"
      >
        <Bug className="size-3.5" />
        dev
      </button>
    );
  }

  return (
    <div className="bg-card fixed right-4 bottom-4 z-50 flex max-h-[70vh] w-80 flex-col overflow-hidden rounded-lg border shadow-xl">
      <div className="flex items-center justify-between border-b px-3 py-2">
        <span className="flex items-center gap-1.5 text-xs font-semibold">
          <Bug className="size-3.5" />
          Dev panel
        </span>
        <Button
          variant="ghost"
          size="icon"
          className="size-6"
          onClick={() => setOpen(false)}
        >
          <X className="size-3.5" />
          <span className="sr-only">Close</span>
        </Button>
      </div>
      <div className="overflow-auto p-3">
        {sections.map((section) => (
          <div key={section.label} className="mb-3 last:mb-0">
            <div className="text-muted-foreground mb-1 text-[10px] font-semibold tracking-wide uppercase">
              {section.label}
            </div>
            <pre className="bg-muted overflow-x-auto rounded p-2 font-mono text-[11px] leading-relaxed">
              {JSON.stringify(section.value, null, 2)}
            </pre>
          </div>
        ))}
      </div>
    </div>
  );
}
