"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useAction } from "next-safe-action/hooks";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import type { z } from "zod";
import { Button } from "@/components/ui/button";
import { TextField } from "@/components/ui/text-field";
import { completeCarrierOnboarding, completeShipperOnboarding } from "@/server/actions/onboarding";
import { carrierOnboardingSchema, shipperOnboardingSchema } from "./schemas";

type Defaults = { firstName: string; lastName: string; phone: string };

export function ShipperOnboardingForm({ defaults }: { defaults: Defaults }) {
  const router = useRouter();
  const form = useForm<z.input<typeof shipperOnboardingSchema>>({ resolver: zodResolver(shipperOnboardingSchema), defaultValues: defaults });
  const { executeAsync, isPending } = useAction(completeShipperOnboarding);
  const { errors } = form.formState;

  const onSubmit = form.handleSubmit(async (values) => {
    const result = await executeAsync(values);
    if (result?.serverError) return toast.error(result.serverError);
    router.replace("/app");
    router.refresh();
  });

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
      <div className="grid gap-4 medium:grid-cols-2">
        <TextField label="First name" autoComplete="given-name" error={errors.firstName?.message} {...form.register("firstName")} />
        <TextField label="Last name" autoComplete="family-name" error={errors.lastName?.message} {...form.register("lastName")} />
      </div>
      <TextField label="Phone (optional)" type="tel" autoComplete="tel" supportingText="Shared only with the carrier and driver of a booked load" error={errors.phone?.message} {...form.register("phone")} />
      <Button type="submit" className="self-end" loading={isPending}>
        Continue
      </Button>
    </form>
  );
}

export function CarrierOnboardingForm({ defaults }: { defaults: Defaults }) {
  const router = useRouter();
  const form = useForm<z.input<typeof carrierOnboardingSchema>>({
    resolver: zodResolver(carrierOnboardingSchema),
    defaultValues: { ...defaults, legalName: "", dbaName: "", usdotNumber: "", mcNumber: "" },
  });
  const { executeAsync, isPending } = useAction(completeCarrierOnboarding);
  const { errors } = form.formState;

  const onSubmit = form.handleSubmit(async (values) => {
    const result = await executeAsync(values);
    if (result?.serverError) return toast.error(result.serverError);
    router.replace("/app");
    router.refresh();
  });

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-6" noValidate>
      <fieldset className="flex flex-col gap-4">
        <legend className="mb-4 text-title-md text-on-surface">You</legend>
        <div className="grid gap-4 medium:grid-cols-2">
          <TextField label="First name" autoComplete="given-name" error={errors.firstName?.message} {...form.register("firstName")} />
          <TextField label="Last name" autoComplete="family-name" error={errors.lastName?.message} {...form.register("lastName")} />
        </div>
        <TextField label="Phone" type="tel" autoComplete="tel" required error={errors.phone?.message} {...form.register("phone")} />
      </fieldset>
      <fieldset className="flex flex-col gap-4">
        <legend className="mb-4 text-title-md text-on-surface">Company</legend>
        <TextField label="Legal name" autoComplete="organization" required supportingText="As registered with FMCSA" error={errors.legalName?.message} {...form.register("legalName")} />
        <TextField label="Doing business as (optional)" error={errors.dbaName?.message} {...form.register("dbaName")} />
        <div className="grid gap-4 medium:grid-cols-2">
          <TextField label="USDOT number" inputMode="numeric" required error={errors.usdotNumber?.message} {...form.register("usdotNumber")} />
          <TextField label="MC number (optional)" supportingText="Required for interstate for-hire carriers" error={errors.mcNumber?.message} {...form.register("mcNumber")} />
        </div>
      </fieldset>
      <p className="text-body-md text-on-surface-variant">
        We check your operating authority and insurance with FMCSA. You can set up your profile and drivers now, and bid once verification passes.
      </p>
      <Button type="submit" className="self-end" loading={isPending}>
        Create company
      </Button>
    </form>
  );
}
