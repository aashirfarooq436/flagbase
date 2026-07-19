"use client";

import type { UpdateFlagRulesRequest } from "@flagbase/contracts";
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
import { Textarea } from "@flagbase/ui/components/textarea";

import { Plus, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { useFlag, useMyRole, useUpdateFlagRules } from "@/lib/hooks";
import { getErrorMessage } from "@/lib/utils/get-error-message";

/** Local, editable shape: user IDs as newline-separated text for easy editing. */
type EditableRule = { userIds: string; value: boolean };

export function TargetingRulesEditor({
  organizationId,
  projectId,
  flagId,
}: {
  organizationId: string;
  projectId: string;
  flagId: string;
}) {
  const { data: flag } = useFlag(organizationId, projectId, flagId);
  const updateRules = useUpdateFlagRules(organizationId, projectId);
  const role = useMyRole(organizationId);
  const canManage = role === "owner" || role === "admin";

  const [rules, setRules] = useState<EditableRule[]>([]);
  const [rollout, setRollout] = useState(100);

  // Hydrate from the server whenever the flag's data actually changes (React Query's structural
  // sharing keeps the reference stable across no-op refetches, so local edits aren't clobbered).
  useEffect(() => {
    if (!flag) {
      return;
    }
    setRules(
      flag.targetingRules.map((rule) => ({
        userIds: rule.userIds.join("\n"),
        value: rule.value,
      })),
    );
    setRollout(flag.rolloutPercentage);
  }, [flag]);

  function addRule() {
    setRules((prev) => [...prev, { userIds: "", value: true }]);
  }

  function removeRule(index: number) {
    setRules((prev) => prev.filter((_, i) => i !== index));
  }

  function patchRule(index: number, patch: Partial<EditableRule>) {
    setRules((prev) =>
      prev.map((rule, i) => (i === index ? { ...rule, ...patch } : rule)),
    );
  }

  function onSave() {
    const body: UpdateFlagRulesRequest = {
      targetingRules: rules.map((rule) => ({
        type: "user-id-list",
        userIds: rule.userIds
          .split("\n")
          .map((id) => id.trim())
          .filter(Boolean),
        value: rule.value,
      })),
      rolloutPercentage: rollout,
    };
    updateRules.mutate(
      { flagId, body },
      {
        onSuccess: () => toast.success("Targeting saved."),
        onError: (error) => toast.error(getErrorMessage(error)),
      },
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Targeting</CardTitle>
        <CardDescription>
          Rules are checked in order; the first list a user appears in decides
          their value. Everyone else falls through to the rollout.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          {rules.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              No targeting rules — every user falls through to the rollout
              below.
            </p>
          ) : null}
          {rules.map((rule, index) => (
            <div key={index} className="space-y-3 rounded-md border p-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">User ID list</span>
                {canManage ? (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeRule(index)}
                    aria-label="Remove rule"
                  >
                    <Trash2 className="size-4" />
                  </Button>
                ) : null}
              </div>
              <Textarea
                placeholder={"user-123\nuser-456"}
                value={rule.userIds}
                disabled={!canManage}
                onChange={(event) =>
                  patchRule(index, { userIds: event.target.value })
                }
              />
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground text-sm">Serve</span>
                <Button
                  type="button"
                  variant={rule.value ? "default" : "outline"}
                  size="sm"
                  disabled={!canManage}
                  onClick={() => patchRule(index, { value: true })}
                >
                  on
                </Button>
                <Button
                  type="button"
                  variant={!rule.value ? "default" : "outline"}
                  size="sm"
                  disabled={!canManage}
                  onClick={() => patchRule(index, { value: false })}
                >
                  off
                </Button>
              </div>
            </div>
          ))}
          {canManage ? (
            <Button variant="outline" size="sm" onClick={addRule}>
              <Plus className="size-4" /> Add rule
            </Button>
          ) : null}
        </div>

        <div className="space-y-2">
          <label htmlFor="rollout" className="text-sm font-medium">
            Rollout percentage
          </label>
          <div className="flex items-center gap-2">
            <Input
              id="rollout"
              type="number"
              min={0}
              max={100}
              value={rollout}
              disabled={!canManage}
              onChange={(event) => setRollout(Number(event.target.value))}
              className="w-24"
            />
            <span className="text-muted-foreground text-sm">
              % of remaining users get the flag on
            </span>
          </div>
        </div>
      </CardContent>
      {canManage ? (
        <CardFooter>
          <Button onClick={onSave} disabled={updateRules.isPending}>
            {updateRules.isPending ? "Saving…" : "Save targeting"}
          </Button>
        </CardFooter>
      ) : null}
    </Card>
  );
}
