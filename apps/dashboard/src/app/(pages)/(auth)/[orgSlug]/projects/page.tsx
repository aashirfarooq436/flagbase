import { CreateProjectDialog } from "@/components/project/create-project-dialog";
import { ProjectTable } from "@/components/project/project-table";

export default function ProjectsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">Projects</h1>
          <p className="text-muted-foreground text-sm">
            Group your feature flags by project.
          </p>
        </div>
        <CreateProjectDialog />
      </div>
      <ProjectTable />
    </div>
  );
}
