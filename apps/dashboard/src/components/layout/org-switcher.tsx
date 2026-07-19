"use client";

import { Button } from "@flagbase/ui/components/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@flagbase/ui/components/dropdown-menu";
import { cn } from "@flagbase/ui/lib/utils";

import { Check, ChevronsUpDown } from "lucide-react";
import { useRouter } from "next/navigation";

import { routes } from "@/lib/constants/routes";
import { useMyOrganizations } from "@/lib/hooks";

export function OrgSwitcher({ currentOrgId }: { currentOrgId: string }) {
  const router = useRouter();
  const { data: organizations } = useMyOrganizations();
  const current = organizations?.find((org) => org.id === currentOrgId);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="w-56 justify-between gap-2">
          <span className="truncate">
            {current?.name ?? "Select organization"}
          </span>
          <ChevronsUpDown className="size-4 shrink-0 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-56">
        {organizations?.map((org) => (
          <DropdownMenuItem
            key={org.id}
            onClick={() => router.push(routes.organization(org.id))}
          >
            <Check
              className={cn(
                "size-4",
                org.id === currentOrgId ? "opacity-100" : "opacity-0",
              )}
            />
            <span className="truncate">{org.name}</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
