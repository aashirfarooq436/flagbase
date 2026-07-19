import { CreateFlagDialog } from "@/components/flag/create-flag-dialog";
import { FlagTable } from "@/components/flag/flag-table";
import { ProjectHeader } from "@/components/project/project-header";
import { RenameProjectForm } from "@/components/project/rename-project-form";

export default async function ProjectPage({
  params,
}: {
  params: Promise<{ orgSlug: string; projectId: string }>;
}) {
  const { projectId } = await params;
  return (
    <div className="space-y-10">
      <ProjectHeader projectId={projectId} />

      <section className="space-y-4">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-lg font-semibold">Flags</h2>
          <CreateFlagDialog projectId={projectId} />
        </div>
        <FlagTable projectId={projectId} />
      </section>

      <section className="max-w-2xl space-y-4">
        <h2 className="text-lg font-semibold">Project settings</h2>
        <RenameProjectForm projectId={projectId} />
      </section>
    </div>
  );
}
