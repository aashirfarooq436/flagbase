import { composition } from "@flagbase/composition";
import {
  createOrganizationRequestSchema,
  type OrganizationResponse,
} from "@flagbase/contracts";
import { type NextRequest, NextResponse } from "next/server";

import { withAppHandlers } from "@/lib/decorators";
import { toOrganizationResponse } from "@/lib/presenters/organization.presenter";

export const POST = withAppHandlers(async (req: NextRequest, ctx) => {
  const { name } = createOrganizationRequestSchema.parse(await req.json());
  const organization = await composition.organization.create.execute({
    name,
    ownerUserId: ctx.userId,
  });

  const response: OrganizationResponse = toOrganizationResponse(organization);
  return NextResponse.json(response, { status: 201 });
});

export const GET = withAppHandlers(async (_req, ctx) => {
  const organizations = await composition.organization.listMine.execute({
    userId: ctx.userId,
  });

  const response: OrganizationResponse[] = organizations.map(
    toOrganizationResponse,
  );
  return NextResponse.json(response);
});
