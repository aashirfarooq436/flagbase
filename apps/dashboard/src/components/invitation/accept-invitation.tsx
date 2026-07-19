"use client";

import { Button } from "@flagbase/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@flagbase/ui/components/card";

import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { routes } from "@/lib/constants/routes";
import { useAcceptInvitation, useRejectInvitation } from "@/lib/hooks";
import { getErrorMessage } from "@/lib/utils/get-error-message";

export function AcceptInvitation({ token }: { token: string }) {
  const router = useRouter();
  const accept = useAcceptInvitation();
  const reject = useRejectInvitation();

  function onAccept() {
    accept.mutate(
      { token },
      {
        onSuccess: (member) => {
          toast.success("You've joined the organization.");
          router.push(routes.organization(member.organizationId));
        },
        onError: (error) => toast.error(getErrorMessage(error)),
      },
    );
  }

  function onReject() {
    reject.mutate(
      { token },
      {
        onSuccess: () => {
          toast.success("Invitation declined.");
          router.push(routes.home);
        },
        onError: (error) => toast.error(getErrorMessage(error)),
      },
    );
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Organization invitation</CardTitle>
        <CardDescription>
          {token
            ? "You've been invited to join an organization."
            : "This link is missing its invitation token."}
        </CardDescription>
      </CardHeader>
      <CardContent className="text-muted-foreground text-sm">
        Accept to join, or decline to turn it down.
      </CardContent>
      <CardFooter className="gap-2">
        <Button onClick={onAccept} disabled={!token || accept.isPending}>
          {accept.isPending ? "Joining…" : "Accept"}
        </Button>
        <Button
          variant="outline"
          onClick={onReject}
          disabled={!token || reject.isPending}
        >
          Decline
        </Button>
      </CardFooter>
    </Card>
  );
}
