"use client";

import { ThemeToggle } from "@flagbase/ui/components/theme-toggle";

import { OrgSwitcher } from "./org-switcher";
import { UserMenu } from "./user-menu";

/** The top bar of the authenticated shell: org switcher on the left, theme + user on the right. */
export function AppTopbar() {
  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b px-4">
      <OrgSwitcher />
      <div className="flex items-center gap-2">
        <ThemeToggle />
        <UserMenu />
      </div>
    </header>
  );
}
