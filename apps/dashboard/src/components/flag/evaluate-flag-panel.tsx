"use client";

import { Badge } from "@flagbase/ui/components/badge";
import { Button } from "@flagbase/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@flagbase/ui/components/card";
import { Input } from "@flagbase/ui/components/input";

import { useState } from "react";
import { toast } from "sonner";

import { useEvaluateFlag } from "@/lib/hooks";
import { useCurrentOrganization } from "@/lib/providers";
import { getErrorMessage } from "@/lib/utils/get-error-message";

export function EvaluateFlagPanel({
  projectId,
  flagId,
}: {
  projectId: string;
  flagId: string;
}) {
  const { id: organizationId } = useCurrentOrganization();
  const [key, setKey] = useState("");
  const [result, setResult] = useState<boolean | null>(null);
  const evaluate = useEvaluateFlag(organizationId, projectId, flagId);

  function onEvaluate() {
    evaluate.mutate(
      { context: { key } },
      {
        onSuccess: (response) => setResult(response.value),
        onError: (error) => {
          setResult(null);
          toast.error(getErrorMessage(error));
        },
      },
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Test evaluation</CardTitle>
        <CardDescription>
          See what a given user would get under the current targeting.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex items-end gap-2">
        <div className="flex-1 space-y-1">
          <label htmlFor="eval-key" className="text-sm font-medium">
            User key
          </label>
          <Input
            id="eval-key"
            placeholder="user-123"
            value={key}
            onChange={(event) => setKey(event.target.value)}
          />
        </div>
        <Button onClick={onEvaluate} disabled={!key || evaluate.isPending}>
          {evaluate.isPending ? "Evaluating…" : "Evaluate"}
        </Button>
      </CardContent>
      {result !== null ? (
        <CardFooter className="gap-2 text-sm">
          Result:{" "}
          <Badge variant={result ? "default" : "outline"}>
            {result ? "on" : "off"}
          </Badge>
        </CardFooter>
      ) : null}
    </Card>
  );
}
