import { DevTools } from "@/components/dev/dev-tools";
import { AppProviders } from "@/lib/providers";

// Every real page renders under one provider tree (theme + React Query + ApiClient + toaster).
// Concentrated here so `(pages)` stays a clean sibling to any future top-level group.
export default function PagesLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <AppProviders>
      {children}
      {/* Dev-only inspector — dead-code-eliminated from production builds. */}
      <DevTools />
    </AppProviders>
  );
}
