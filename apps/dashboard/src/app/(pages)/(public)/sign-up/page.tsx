import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@flagbase/ui/components/card";
import Link from "next/link";

import { SignUpForm } from "@/components/auth/sign-up-form";
import { routes } from "@/lib/constants/routes";

export default function SignUpPage() {
  return (
    <Card>
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">Create your account</CardTitle>
        <CardDescription>Get started with FlagBase</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <SignUpForm />
        <p className="text-muted-foreground text-center text-sm">
          Already have an account?{" "}
          <Link
            href={routes.signIn}
            className="text-primary underline-offset-4 hover:underline"
          >
            Sign in
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
