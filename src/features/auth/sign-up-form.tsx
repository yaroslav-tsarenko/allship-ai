"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Divider } from "@/components/ui/divider";
import { PasswordField } from "@/components/ui/password-field";
import { SegmentedButton } from "@/components/ui/segmented-button";
import { TextField } from "@/components/ui/text-field";
import { authClient } from "@/server/auth/client";
import { GoogleButton } from "./google-button";
import { captchaHeaders, Turnstile } from "./turnstile";

const schema = z.object({
  accountType: z.enum(["shipper", "carrier"]),
  firstName: z.string().trim().min(1, "Enter your first name").max(60),
  lastName: z.string().trim().min(1, "Enter your last name").max(60),
  email: z.email("Enter a valid email address"),
  phone: z
    .string()
    .trim()
    .regex(/^$|^\+?[0-9 ()-]{10,20}$/, "Enter a US phone number, for example (555) 123-4567")
    .optional(),
  password: z
    .string()
    .min(10, "Use at least 10 characters")
    .max(128)
    .regex(/[a-zA-Z]/, "Add at least one letter")
    .regex(/[0-9]/, "Add at least one number"),
  terms: z.literal(true, { error: "You need to accept the terms to continue" }),
});
type Values = z.input<typeof schema>;

export function SignUpForm({
  googleEnabled,
  defaultType,
  defaultEmail = "",
  lockType = false,
  callbackURL = "/app/onboarding",
  signInHref = "/sign-in",
}: {
  googleEnabled: boolean;
  defaultType: "shipper" | "carrier";
  defaultEmail?: string;
  lockType?: boolean;
  callbackURL?: string;
  signInHref?: string;
}) {
  const router = useRouter();
  const [captcha, setCaptcha] = useState<string | null>(null);
  const [captchaReset, setCaptchaReset] = useState(0);
  const onToken = useCallback((t: string | null) => setCaptcha(t), []);
  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: {
      accountType: defaultType,
      firstName: "",
      lastName: "",
      email: defaultEmail,
      phone: "",
      password: "",
      terms: false as unknown as true,
    },
  });
  const { errors, isSubmitting } = form.formState;
  const accountType = form.watch("accountType");

  const onSubmit = form.handleSubmit(async (values) => {
    const { error } = await authClient.signUp.email(
      {
        email: values.email,
        password: values.password,
        name: `${values.firstName} ${values.lastName}`.trim(),
        firstName: values.firstName,
        lastName: values.lastName,
        phone: values.phone || undefined,
        accountType: lockType ? defaultType : values.accountType,
        callbackURL,
      },
      captchaHeaders(captcha),
    );
    if (error) {
      setCaptchaReset((n) => n + 1);
      if (error.code === "USER_ALREADY_EXISTS" || error.status === 422) {
        form.setError("email", { message: "An account with this email already exists. Sign in instead." });
        return;
      }
      if (error.code === "PASSWORD_COMPROMISED") {
        form.setError("password", { message: error.message ?? "This password appeared in a data breach." });
        return;
      }
      toast.error(error.message ?? "We could not create your account. Try again.");
      return;
    }
    router.push(`/verify-email?email=${encodeURIComponent(values.email)}`);
  });

  return (
    <div className="flex flex-col gap-5">
      {!lockType && (
        <Controller
          control={form.control}
          name="accountType"
          render={({ field }) => (
            <SegmentedButton
              label="Account type"
              value={field.value}
              onChange={field.onChange}
              options={[
                { value: "shipper", label: "I need to ship" },
                { value: "carrier", label: "I run trucks" },
              ]}
            />
          )}
        />
      )}
      {!lockType && (
        <p className="text-body-sm text-on-surface-variant -mt-2 px-1">
          {accountType === "carrier"
            ? "You will add your company, USDOT and MC numbers next. Drivers join later by invitation."
            : "Post loads, compare bids from verified carriers and pay into escrow."}
        </p>
      )}
      {googleEnabled && <GoogleButton callbackURL={callbackURL} label="Sign up with Google" />}
      {googleEnabled && <Divider label="or" />}
      <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
        <div className="medium:grid-cols-2 grid gap-4">
          <TextField
            label="First name"
            autoComplete="given-name"
            error={errors.firstName?.message}
            {...form.register("firstName")}
          />
          <TextField
            label="Last name"
            autoComplete="family-name"
            error={errors.lastName?.message}
            {...form.register("lastName")}
          />
        </div>
        <TextField
          label="Email"
          type="email"
          autoComplete="email"
          inputMode="email"
          error={errors.email?.message}
          {...form.register("email")}
        />
        <TextField
          label="Phone (optional)"
          type="tel"
          autoComplete="tel"
          inputMode="tel"
          supportingText="Carriers and drivers can call you about pickup details"
          error={errors.phone?.message}
          {...form.register("phone")}
        />
        <PasswordField
          label="Password"
          autoComplete="new-password"
          supportingText="At least 10 characters with a letter and a number"
          error={errors.password?.message}
          {...form.register("password")}
        />
        <Controller
          control={form.control}
          name="terms"
          render={({ field }) => (
            <Checkbox
              checked={field.value === true}
              onCheckedChange={(v) => field.onChange(v === true)}
              error={errors.terms?.message}
              label={
                <>
                  I agree to the{" "}
                  <Link href="/terms-and-conditions" className="text-primary font-medium hover:underline">
                    Terms
                  </Link>{" "}
                  and{" "}
                  <Link href="/privacy-policy" className="text-primary font-medium hover:underline">
                    Privacy Policy
                  </Link>
                </>
              }
            />
          )}
        />
        <Turnstile onToken={onToken} resetKey={captchaReset} />
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
          <Button variant="text" asChild>
            <Link href={signInHref}>Sign in instead</Link>
          </Button>
          <Button type="submit" loading={isSubmitting}>
            Create account
          </Button>
        </div>
      </form>
    </div>
  );
}
