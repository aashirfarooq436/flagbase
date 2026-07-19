import { EvaluateFlagPanel } from "@/components/flag/evaluate-flag-panel";
import { FlagHeader } from "@/components/flag/flag-header";
import { TargetingRulesEditor } from "@/components/flag/targeting-rules-editor";

export default async function FlagPage({
  params,
}: {
  params: Promise<{ orgId: string; projectId: string; flagId: string }>;
}) {
  const { orgId, projectId, flagId } = await params;
  return (
    <div className="max-w-3xl space-y-8">
      <FlagHeader
        organizationId={orgId}
        projectId={projectId}
        flagId={flagId}
      />
      <TargetingRulesEditor
        organizationId={orgId}
        projectId={projectId}
        flagId={flagId}
      />
      <EvaluateFlagPanel
        organizationId={orgId}
        projectId={projectId}
        flagId={flagId}
      />
    </div>
  );
}
