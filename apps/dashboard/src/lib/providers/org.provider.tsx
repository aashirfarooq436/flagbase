"use client";

import { createContext, type ReactNode, useContext } from "react";

/** The organization the current `/[orgSlug]/...` subtree is scoped to. */
export type CurrentOrganization = {
  id: string;
  slug: string;
  name: string;
};

const OrgContext = createContext<CurrentOrganization | null>(null);

/**
 * Provides the active organization (resolved from the URL slug in the org layout) to everything
 * under it. Components read `id` for API/hook calls and `slug` for building links — so the URL
 * stays slug-based while the API stays id-based, with no prop-drilling.
 */
export function OrgProvider({
  organization,
  children,
}: {
  organization: CurrentOrganization;
  children: ReactNode;
}) {
  return (
    <OrgContext.Provider value={organization}>{children}</OrgContext.Provider>
  );
}

export function useCurrentOrganization(): CurrentOrganization {
  const organization = useContext(OrgContext);
  if (organization === null) {
    throw new Error(
      "useCurrentOrganization must be used within an OrgProvider.",
    );
  }
  return organization;
}
