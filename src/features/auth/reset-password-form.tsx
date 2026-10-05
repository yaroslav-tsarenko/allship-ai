"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { PasswordField } from "@/components/ui/password-field";
import { authClient } from "@/server/auth/client";

const schema = z
  .object({
    password: z.string().min(10, "Use at least 10 characters").max(128).regex(/[a-zA-Z]/, "Add at least one letter").regex(/[0-9]/, "Add at least one number"),
    confirm: z.string(),
  })
  .refine((v) => v.password === v.confirm, { path: ["confirm"], message: "Passwords do not match" });

export function ResetPasswordForm({ token }: { token: string | null }) {
  const router = useRouter();
  const form = useForm<z.infer<typeof schema>>({ resolver: zodResolver(schema), defaultValues: { password: "", confirm: "" } });

  if (!token) {
    return (
      <div className="flex flex-col gap-4">
        <p className="text-body-lg text-on-surface-variant">This reset link is invalid or has expired. Request a new one.</p>
        <Button className="self-start" asChild>
          <Link href="/forgot-password">Request a new link</Link>
        </Button>
      </div>
    );
  }

  const onSubmit = form.handleSubmit(async ({ password }) => {
    const { error } = await authClient.resetPassword({ newPassword: password, token });
    if (error) {
      if (error.code === "PASSWORD_COMPROMISED") {
        form.setError("password", { message: error.message ?? "This password appeared in a data breach." });
        return;
      }
      toast.error(error.message ?? "This reset link is invalid or has expired.");
      return;
    }
    toast("Password updated. Sign in with your new password.");
    router.replace("/sign-in");
  });

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
      <PasswordField label="New password" autoComplete="new-password" autoFocus supportingText="At least 10 characters with a letter and a number" error={form.formState.errors.password?.message} {...form.register("password")} />
      <PasswordField label="Confirm new password" autoComplete="new-password" error={form.formState.errors.confirm?.message} {...form.register("confirm")} />
      <Button type="submit" className="self-end" loading={form.formState.isSubmitting}>
        Save password
      </Button>
    </form>
  );
}
