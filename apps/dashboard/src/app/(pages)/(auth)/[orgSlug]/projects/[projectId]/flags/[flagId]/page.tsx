import { EvaluateFlagPanel } from "@/components/flag/evaluate-flag-panel";
import { FlagHeader } from "@/components/flag/flag-header";
import { TargetingRulesEditor } from "@/components/flag/targeting-rules-editor";

export default async function FlagPage({
  params,
}: {
  params: Promise<{ orgSlug: string; projectId: string; flagId: string }>;
}) {
  const { projectId, flagId } = await params;
  return (
    <div className="max-w-3xl space-y-8">
      <FlagHeader projectId={projectId} flagId={flagId} />
      <TargetingRulesEditor projectId={projectId} flagId={flagId} />
      <EvaluateFlagPanel projectId={projectId} flagId={flagId} />
    </div>
  );
}
