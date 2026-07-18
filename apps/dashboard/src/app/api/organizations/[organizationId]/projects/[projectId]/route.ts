import { composition } from "@flagbase/composition";
import { renameProjectRequestSchema } from "@flagbase/contracts";
import { HttpStatus } from "@flagbase/shared/http";
import { z } from "zod";

import { toProjectResponse } from "@/lib/presenters/project.presenter";
import { route } from "@/lib/decorators";

const paramsSchema = z.object({ projectId: z.string().min(1) });

export const GET = route({
  access: "organization",
  action: "read",
  subject: "Project",
  params: paramsSchema,
  handle: async ({ params, context }) => {
    const project = await composition.project.get.execute({
      organizationId: context.organizationId,
      projectId: params.projectId,
    });
    return toProjectResponse(project);
  },
});

export const PATCH = route({
  access: "organization",
  action: "update",
  subject: "Project",
  params: paramsSchema,
  body: renameProjectRequestSchema,
  handle: async ({ body, params, context }) => {
    const project = await composition.project.rename.execute({
      organizationId: context.organizationId,
      projectId: params.projectId,
      name: body.name,
    });
    return toProjectResponse(project);
  },
});

export const DELETE = route({
  access: "organization",
  action: "delete",
  subject: "Project",
  params: paramsSchema,
  status: HttpStatus.NoContent,
  handle: async ({ params, context }) => {
    await composition.project.delete.execute({
      organizationId: context.organizationId,
      projectId: params.projectId,
    });
  },
});
