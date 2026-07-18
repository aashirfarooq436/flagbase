"use client";

import { Avatar, AvatarFallback } from "@flagbase/ui/components/avatar";
import { Button } from "@flagbase/ui/components/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@flagbase/ui/components/dropdown-menu";
import { useRouter } from "next/navigation";

import { routes } from "@/lib/constants/routes";
import { useSignOut, useUser } from "@/lib/hooks";

export function UserMenu() {
  const router = useRouter();
  const { data: user } = useUser();
  const signOut = useSignOut();

  function onSignOut() {
    signOut.mutate(undefined, {
      onSuccess: () => router.push(routes.signIn),
    });
  }

  const initials = user ? user.name.slice(0, 2).toUpperCase() : "…";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="rounded-full">
          <Avatar className="size-8">
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
          <span className="sr-only">Open user menu</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="flex flex-col gap-0.5">
          <span>{user?.name}</span>
          <span className="text-muted-foreground text-xs font-normal">
            {user?.email}
          </span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={onSignOut} disabled={signOut.isPending}>
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
