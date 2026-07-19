"use client";

import { Skeleton } from "@flagbase/ui/components/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@flagbase/ui/components/table";

import Link from "next/link";

import { routes } from "@/lib/constants/routes";
import { useProjects } from "@/lib/hooks";

export function ProjectTable({ organizationId }: { organizationId: string }) {
  const { data: projects, isLoading } = useProjects(organizationId);

  if (isLoading) {
    return <Skeleton className="h-40 w-full" />;
  }
  if (!projects?.length) {
    return (
      <p className="text-muted-foreground text-sm">
        No projects yet. Create one to start adding flags.
      </p>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Created</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {projects.map((project) => (
          <TableRow key={project.id}>
            <TableCell>
              <Link
                href={routes.project(organizationId, project.id)}
                className="font-medium hover:underline"
              >
                {project.name}
              </Link>
            </TableCell>
            <TableCell className="text-muted-foreground text-sm">
              {new Date(project.createdAt).toLocaleDateString()}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
