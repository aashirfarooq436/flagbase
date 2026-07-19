"use client";

import { cn } from "@flagbase/ui/lib/utils";

import { Folder, LayoutDashboard, Mail, Settings, Users } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { routes } from "@/lib/constants/routes";
import { useCurrentOrganization } from "@/lib/providers";

/** The authenticated shell's left nav. Org-scoped links, active state from the pathname. */
export function AppSidebar() {
  const pathname = usePathname();
  const { slug } = useCurrentOrganization();

  const items = [
    {
      label: "Overview",
      href: routes.organization(slug),
      icon: LayoutDashboard,
      exact: true,
    },
    { label: "Projects", href: routes.projects(slug), icon: Folder },
    { label: "Members", href: routes.members(slug), icon: Users },
    { label: "Invitations", href: routes.invitations(slug), icon: Mail },
    { label: "Settings", href: routes.settings(slug), icon: Settings },
  ];

  return (
    <aside className="flex w-56 shrink-0 flex-col border-r p-3">
      <nav className="flex flex-col gap-1">
        {items.map((item) => {
          const active = item.exact
            ? pathname === item.href
            : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors",
                active
                  ? "bg-accent text-accent-foreground"
                  : "text-muted-foreground hover:bg-accent/50 hover:text-foreground",
              )}
            >
              <item.icon className="size-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
