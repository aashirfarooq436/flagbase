import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@flagbase/ui/components/card";

import Link from "next/link";

import { routes } from "@/lib/constants/routes";

export default async function OrganizationOverviewPage({
  params,
}: {
  params: Promise<{ orgSlug: string }>;
}) {
  const { orgSlug } = await params;

  const sections = [
    {
      title: "Projects",
      description: "Group and manage your feature flags.",
      href: routes.projects(orgSlug),
    },
    {
      title: "Members",
      description: "People in this organization and their roles.",
      href: routes.members(orgSlug),
    },
    {
      title: "Invitations",
      description: "Invite teammates and manage pending invites.",
      href: routes.invitations(orgSlug),
    },
    {
      title: "Settings",
      description: "Rename this organization.",
      href: routes.settings(orgSlug),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Overview</h1>
        <p className="text-muted-foreground text-sm">
          Jump into your organization.
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        {sections.map((section) => (
          <Link key={section.href} href={section.href}>
            <Card className="transition-colors hover:bg-accent/50">
              <CardHeader>
                <CardTitle>{section.title}</CardTitle>
                <CardDescription>{section.description}</CardDescription>
              </CardHeader>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
