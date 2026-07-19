"use client";

import {
  type InviteMemberRequest,
  inviteMemberRequestSchema,
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
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@flagbase/ui/components/form";
import { Input } from "@flagbase/ui/components/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@flagbase/ui/components/select";

import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { useInviteMember, useMyRole } from "@/lib/hooks";
import { useCurrentOrganization } from "@/lib/providers";
import { getErrorMessage } from "@/lib/utils/get-error-message";

export function InviteMemberDialog() {
  const { id: organizationId } = useCurrentOrganization();
  const [open, setOpen] = useState(false);
  const inviteMember = useInviteMember(organizationId);
  const canInvite = useMyRole(organizationId) === "owner";

  const form = useForm<InviteMemberRequest>({
    resolver: zodResolver(inviteMemberRequestSchema),
    defaultValues: { email: "", role: "member" },
  });

  if (!canInvite) {
    return null;
  }

  function onSubmit(values: InviteMemberRequest) {
    inviteMember.mutate(values, {
      onSuccess: () => {
        toast.success("Invitation sent.");
        form.reset();
        setOpen(false);
      },
      onError: (error) => toast.error(getErrorMessage(error)),
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>Invite member</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Invite a member</DialogTitle>
          <DialogDescription>
            They&apos;ll get an email with a link to join.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      placeholder="teammate@example.com"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="role"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Role</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="admin">admin</SelectItem>
                      <SelectItem value="member">member</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="submit" disabled={inviteMember.isPending}>
                {inviteMember.isPending ? "Sending…" : "Send invitation"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
