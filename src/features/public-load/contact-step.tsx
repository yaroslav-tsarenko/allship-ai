"use client";

import Link from "next/link";
import { Controller, get, useFormContext } from "react-hook-form";
import { Checkbox } from "@/components/ui/checkbox";
import { TextField } from "@/components/ui/text-field";
import { Turnstile } from "@/features/auth/turnstile";
import { formatUsPhone, SMS_CONSENT_TEXT, type PublicLoadValues } from "./model";

export function ContactStep({ onEmailBlur, onToken, locked }: { onEmailBlur: () => void; onToken: (token: string | null) => void; locked: boolean }) {
  const { register, control, formState } = useFormContext<PublicLoadValues>();
  const err = (k: string) => get(formState.errors, `contact.${k}`)?.message as string | undefined;
  const email = register("contact.email");

  return (
    <div className="flex flex-col gap-5">
      <div className="grid gap-x-4 gap-y-5 medium:grid-cols-2">
        <TextField label="First name" required autoComplete="given-name" error={err("firstName")} {...register("contact.firstName")} />
        <TextField label="Last name" required autoComplete="family-name" error={err("lastName")} {...register("contact.lastName")} />
      </div>
      <TextField
        label="Email"
        type="email"
        required
        inputMode="email"
        autoComplete="email"
        readOnly={locked}
        supportingText={locked ? "You're signed in with this email." : "We send a link here to confirm and publish your load."}
        error={err("email")}
        {...email}
        onBlur={(e) => {
          void email.onBlur(e);
          onEmailBlur();
        }}
      />
      <Controller
        control={control}
        name="contact.phone"
        render={({ field }) => (
          <TextField
            label="Phone"
            type="tel"
            required
            inputMode="tel"
            autoComplete="tel-national"
            supportingText="US number. Carriers you book can call you about pickup."
            error={err("phone")}
            name={field.name}
            ref={field.ref}
            value={field.value}
            onBlur={field.onBlur}
            onChange={(e) => field.onChange(formatUsPhone(e.target.value))}
          />
        )}
      />
      <Controller
        control={control}
        name="contact.smsConsent"
        render={({ field }) => <Checkbox checked={field.value} onCheckedChange={(v) => field.onChange(v === true)} label={<span className="text-body-sm text-on-surface-variant">{SMS_CONSENT_TEXT}</span>} />}
      />
      <div aria-hidden="true" className="absolute -left-[9999px] h-px w-px overflow-hidden">
        <label>
          Website
          <input type="text" tabIndex={-1} autoComplete="off" {...register("website")} />
        </label>
      </div>
      <Turnstile onToken={onToken} />
      <p className="text-body-sm text-pretty text-on-surface-variant">
        By creating a load you agree to our{" "}
        <Link href="/terms-and-conditions" className="text-primary underline-offset-2 hover:underline">
          Terms and Conditions
        </Link>{" "}
        and{" "}
        <Link href="/privacy-policy" className="text-primary underline-offset-2 hover:underline">
          Privacy Policy
        </Link>
        . We create a free shipper account for this email and send emails about this load: the confirmation link, new bids and status updates.
      </p>
    </div>
  );
}
