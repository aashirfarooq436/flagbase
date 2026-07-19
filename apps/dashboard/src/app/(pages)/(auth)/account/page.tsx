import Link from "next/link";

import { ChangePasswordForm } from "@/components/account/change-password-form";
import { UpdateProfileForm } from "@/components/account/update-profile-form";
import { routes } from "@/lib/constants/routes";

export default function AccountPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-8 p-6">
      <div className="space-y-1">
        <Link
          href={routes.home}
          className="text-muted-foreground text-sm hover:underline"
        >
          ← Back to app
        </Link>
        <h1 className="text-2xl font-semibold tracking-tight">Account</h1>
        <p className="text-muted-foreground text-sm">
          Manage your profile and password.
        </p>
      </div>
      <UpdateProfileForm />
      <ChangePasswordForm />
    </div>
  );
}
