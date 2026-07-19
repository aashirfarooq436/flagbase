"use client";

import {
  type RenameOrganizationRequest,
  renameOrganizationRequestSchema,
} from "@flagbase/contracts";
import { Button } from "@flagbase/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@flagbase/ui/components/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@flagbase/ui/components/form";
import { Input } from "@flagbase/ui/components/input";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { useMyRole, useOrganization, useRenameOrganization } from "@/lib/hooks";
import { useCurrentOrganization } from "@/lib/providers";
import { getErrorMessage } from "@/lib/utils/get-error-message";

export function RenameOrganizationForm() {
  const { id: organizationId } = useCurrentOrganization();
  const { data: organization } = useOrganization(organizationId);
  const renameOrganization = useRenameOrganization(organizationId);
  const canManage = useMyRole(organizationId) === "owner";

  const form = useForm<RenameOrganizationRequest>({
    resolver: zodResolver(renameOrganizationRequestSchema),
    defaultValues: { name: "" },
    values: { name: organization?.name ?? "" },
  });

  function onSubmit(values: RenameOrganizationRequest) {
    renameOrganization.mutate(values, {
      onSuccess: () => toast.success("Organization renamed."),
      onError: (error) => toast.error(getErrorMessage(error)),
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Organization name</CardTitle>
        <CardDescription>
          {canManage
            ? "Rename this organization."
            : "Only the owner can rename the organization."}
        </CardDescription>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent>
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Acme Inc"
                      disabled={!canManage}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
          <CardFooter>
            <Button
              type="submit"
              disabled={!canManage || renameOrganization.isPending}
            >
              {renameOrganization.isPending ? "Saving…" : "Save"}
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}
