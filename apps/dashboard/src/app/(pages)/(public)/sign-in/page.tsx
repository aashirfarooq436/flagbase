import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@flagbase/ui/components/card";

import Link from "next/link";

import { SignInForm } from "@/components/auth/sign-in-form";
import { routes } from "@/lib/constants/routes";

export default function SignInPage() {
  return (
    <Card>
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">Welcome back</CardTitle>
        <CardDescription>Sign in to your FlagBase account</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <SignInForm />
        <p className="text-muted-foreground text-center text-sm">
          No account?{" "}
          <Link
            href={routes.signUp}
            className="text-primary underline-offset-4 hover:underline"
          >
            Sign up
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
