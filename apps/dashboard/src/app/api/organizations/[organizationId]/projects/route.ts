import { composition } from "@flagbase/composition";
import { createProjectRequestSchema } from "@flagbase/contracts";
import { HttpStatus } from "@flagbase/shared/http";

import { route } from "@/lib/decorators";
import { toProjectResponse } from "@/lib/presenters/project.presenter";

export const GET = route({
  access: "organization",
  action: "read",
  subject: "Project",
  handle: async ({ context }) => {
    const projects = await composition.project.list.execute({
      organizationId: context.organizationId,
    });
    return projects.map(toProjectResponse);
  },
});

export const POST = route({
  access: "organization",
  action: "create",
  subject: "Project",
  body: createProjectRequestSchema,
  status: HttpStatus.Created,
  handle: async ({ body, context }) => {
    const project = await composition.project.create.execute({
      organizationId: context.organizationId,
      name: body.name,
    });
    return toProjectResponse(project);
  },
});
