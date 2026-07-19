"use client";

import {
  type CreateOrganizationRequest,
  createOrganizationRequestSchema,
} from "@flagbase/contracts";
import { Button } from "@flagbase/ui/components/button";
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
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { routes } from "@/lib/constants/routes";
import { useCreateOrganization } from "@/lib/hooks";
import { getErrorMessage } from "@/lib/utils/get-error-message";

export function CreateOrganizationForm() {
  const router = useRouter();
  const createOrganization = useCreateOrganization();

  const form = useForm<CreateOrganizationRequest>({
    resolver: zodResolver(createOrganizationRequestSchema),
    defaultValues: { name: "" },
  });

  function onSubmit(values: CreateOrganizationRequest) {
    createOrganization.mutate(values, {
      onSuccess: (organization) =>
        router.push(routes.organization(organization.slug)),
      onError: (error) => toast.error(getErrorMessage(error)),
    });
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Organization name</FormLabel>
              <FormControl>
                <Input placeholder="Acme Inc" autoFocus {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button
          type="submit"
          className="w-full"
          disabled={createOrganization.isPending}
        >
          {createOrganization.isPending ? "Creating…" : "Create organization"}
        </Button>
      </form>
    </Form>
  );
}
