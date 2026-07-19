import { RenameOrganizationForm } from "@/components/organization/rename-organization-form";

export default function SettingsPage() {
  return (
    <div className="max-w-2xl space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
        <p className="text-muted-foreground text-sm">
          Manage this organization.
        </p>
      </div>
      <RenameOrganizationForm />
    </div>
  );
}
