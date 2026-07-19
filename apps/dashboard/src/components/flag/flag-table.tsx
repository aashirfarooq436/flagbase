"use client";

import { Badge } from "@flagbase/ui/components/badge";
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
import { useFlags } from "@/lib/hooks";

export function FlagTable({
  organizationId,
  projectId,
}: {
  organizationId: string;
  projectId: string;
}) {
  const { data: flags, isLoading } = useFlags(organizationId, projectId);

  if (isLoading) {
    return <Skeleton className="h-40 w-full" />;
  }
  if (!flags?.length) {
    return (
      <p className="text-muted-foreground text-sm">
        No flags yet. Create one to start targeting.
      </p>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Key</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="text-right">Rollout</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {flags.map((flag) => (
          <TableRow key={flag.id}>
            <TableCell>
              <Link
                href={routes.flag(organizationId, projectId, flag.id)}
                className="font-mono text-sm hover:underline"
              >
                {flag.key}
              </Link>
              {flag.description ? (
                <p className="text-muted-foreground text-xs">
                  {flag.description}
                </p>
              ) : null}
            </TableCell>
            <TableCell>
              <Badge variant={flag.enabled ? "default" : "outline"}>
                {flag.enabled ? "on" : "off"}
              </Badge>
            </TableCell>
            <TableCell className="text-muted-foreground text-right text-sm">
              {flag.rolloutPercentage}%
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
