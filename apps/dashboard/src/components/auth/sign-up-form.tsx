"use client";

import { signUpRequestSchema, type SignUpRequest } from "@flagbase/contracts";
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
import { useSignUp } from "@/lib/hooks";
import { getErrorMessage } from "@/lib/utils/get-error-message";

export function SignUpForm() {
  const router = useRouter();
  const signUp = useSignUp();

  const form = useForm<SignUpRequest>({
    resolver: zodResolver(signUpRequestSchema),
    defaultValues: { email: "", name: "", password: "" },
  });

  function onSubmit(values: SignUpRequest) {
    signUp.mutate(values, {
      // A brand-new user has no organization yet → straight to onboarding.
      onSuccess: () => router.push(routes.onboarding),
      onError: (error) => toast.error(getErrorMessage(error)),
    });
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input
                  placeholder="Ada Lovelace"
                  autoComplete="name"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
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
                <Input type="password" autoComplete="new-password" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" className="w-full" disabled={signUp.isPending}>
          {signUp.isPending ? "Creating account…" : "Create account"}
        </Button>
      </form>
    </Form>
  );
}
