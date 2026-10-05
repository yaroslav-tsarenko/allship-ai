"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useCallback, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { TextField } from "@/components/ui/text-field";
import { authClient } from "@/server/auth/client";
import { captchaHeaders, Turnstile } from "./turnstile";

const schema = z.object({ email: z.email("Enter a valid email address") });

export function ForgotPasswordForm() {
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [captcha, setCaptcha] = useState<string | null>(null);
  const onToken = useCallback((t: string | null) => setCaptcha(t), []);
  const form = useForm<z.infer<typeof schema>>({ resolver: zodResolver(schema), defaultValues: { email: "" } });

  const onSubmit = form.handleSubmit(async ({ email }) => {
    const { error } = await authClient.requestPasswordReset({ email, redirectTo: "/reset-password" }, captchaHeaders(captcha));
    if (error && error.status === 429) {
      toast.error("Too many attempts. Wait a few minutes and try again.");
      return;
    }
    setSentTo(email);
  });

  if (sentTo) {
    return (
      <div className="flex animate-enter flex-col gap-4">
        <p className="text-title-lg text-on-surface">Check your inbox</p>
        <p className="text-body-lg text-on-surface-variant">
          If an account exists for <span className="font-medium text-on-surface">{sentTo}</span>, you will get a link to choose a new password. It expires in 1 hour.
        </p>
        <Button variant="text" className="self-start" asChild>
          <Link href="/sign-in">Back to sign in</Link>
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
      <TextField label="Email" type="email" autoComplete="email" autoFocus error={form.formState.errors.email?.message} {...form.register("email")} />
      <Turnstile onToken={onToken} />
      <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
        <Button variant="text" asChild>
          <Link href="/sign-in">Back to sign in</Link>
        </Button>
        <Button type="submit" loading={form.formState.isSubmitting}>
          Send reset link
        </Button>
      </div>
    </form>
  );
}
