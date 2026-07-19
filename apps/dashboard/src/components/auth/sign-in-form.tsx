"use client";

import { type SignInRequest,signInRequestSchema } from "@flagbase/contracts";
import { Button } from "@flagbase/ui/components/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@flagbase/ui/components/form";
import { Input } from "@flagbase/ui/components/input";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { routes } from "@/lib/constants/routes";
import { useSignIn } from "@/lib/hooks";
import { getErrorMessage } from "@/lib/utils/get-error-message";

export function SignInForm() {
  const router = useRouter();
  const signIn = useSignIn();

  const form = useForm<SignInRequest>({
    resolver: zodResolver(signInRequestSchema),
    defaultValues: { email: "", password: "" },
  });

  function onSubmit(values: SignInRequest) {
    signIn.mutate(values, {
      onSuccess: () => router.push(routes.home),
      onError: (error) => toast.error(getErrorMessage(error)),
    });
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input
                  type="email"
                  placeholder="you@example.com"
                  autoComplete="email"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Password</FormLabel>
              <FormControl>
                <Input
                  type="password"
                  autoComplete="current-password"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" className="w-full" disabled={signIn.isPending}>
          {signIn.isPending ? "Signing in…" : "Sign in"}
        </Button>
      </form>
    </Form>
  );
}
