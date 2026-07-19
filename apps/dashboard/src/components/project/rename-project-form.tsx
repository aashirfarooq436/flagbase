"use client";

import {
  type RenameProjectRequest,
  renameProjectRequestSchema,
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

import { useMyRole, useProject, useRenameProject } from "@/lib/hooks";
import { useCurrentOrganization } from "@/lib/providers";
import { getErrorMessage } from "@/lib/utils/get-error-message";

export function RenameProjectForm({ projectId }: { projectId: string }) {
  const { id: organizationId } = useCurrentOrganization();
  const { data: project } = useProject(organizationId, projectId);
  const renameProject = useRenameProject(organizationId);
  const role = useMyRole(organizationId);
  const canManage = role === "owner" || role === "admin";

  const form = useForm<RenameProjectRequest>({
    resolver: zodResolver(renameProjectRequestSchema),
    defaultValues: { name: "" },
    values: { name: project?.name ?? "" },
  });

  function onSubmit(values: RenameProjectRequest) {
    renameProject.mutate(
      { projectId, body: values },
      {
        onSuccess: () => toast.success("Project renamed."),
        onError: (error) => toast.error(getErrorMessage(error)),
      },
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Project name</CardTitle>
        <CardDescription>
          {canManage
            ? "Rename this project."
            : "You don't have permission to rename this project."}
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
                      placeholder="Web App"
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
              disabled={!canManage || renameProject.isPending}
            >
              {renameProject.isPending ? "Saving…" : "Save"}
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}
