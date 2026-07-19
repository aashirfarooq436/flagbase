"use client";

import {
  type CreateFlagRequest,
  createFlagRequestSchema,
} from "@flagbase/contracts";
import { Button } from "@flagbase/ui/components/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@flagbase/ui/components/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@flagbase/ui/components/form";
import { Input } from "@flagbase/ui/components/input";

import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { useCreateFlag, useMyRole } from "@/lib/hooks";
import { getErrorMessage } from "@/lib/utils/get-error-message";

export function CreateFlagDialog({
  organizationId,
  projectId,
}: {
  organizationId: string;
  projectId: string;
}) {
  const [open, setOpen] = useState(false);
  const createFlag = useCreateFlag(organizationId, projectId);
  const role = useMyRole(organizationId);
  const canManage = role === "owner" || role === "admin";

  const form = useForm<CreateFlagRequest>({
    resolver: zodResolver(createFlagRequestSchema),
    defaultValues: { key: "", description: "", defaultValue: false },
  });

  if (!canManage) {
    return null;
  }

  function onSubmit(values: CreateFlagRequest) {
    createFlag.mutate(values, {
      onSuccess: () => {
        toast.success("Flag created.");
        form.reset();
        setOpen(false);
      },
      onError: (error) => toast.error(getErrorMessage(error)),
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>New flag</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New flag</DialogTitle>
          <DialogDescription>
            A flag starts disabled with a 100% rollout — set targeting after you
            create it.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="key"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Key</FormLabel>
                  <FormControl>
                    <Input placeholder="new-checkout" autoFocus {...field} />
                  </FormControl>
                  <FormDescription>
                    The stable identifier your code checks. Lowercase,
                    hyphen-separated.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Rollout of the new checkout"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="submit" disabled={createFlag.isPending}>
                {createFlag.isPending ? "Creating…" : "Create flag"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
