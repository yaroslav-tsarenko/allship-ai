"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useAction } from "next-safe-action/hooks";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { TextField } from "@/components/ui/text-field";
import { updateProfile } from "@/server/actions/profile";

const schema = z.object({
  firstName: z.string().trim().min(1, "Enter your first name").max(60),
  lastName: z.string().trim().min(1, "Enter your last name").max(60),
  phone: z.string().trim().regex(/^$|^\+?[0-9 ()-]{10,20}$/, "Enter a US phone number, for example (555) 123-4567").optional(),
});

export function ProfileForm({ defaults, email }: { defaults: z.input<typeof schema>; email: string }) {
  const form = useForm<z.input<typeof schema>>({ resolver: zodResolver(schema), defaultValues: defaults });
  const { executeAsync, isPending } = useAction(updateProfile);
  const { errors, isDirty } = form.formState;

  const onSubmit = form.handleSubmit(async (values) => {
    const result = await executeAsync(values);
    if (result?.serverError) return toast.error(result.serverError);
    form.reset(values);
    toast("Profile saved");
  });

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
      <div className="grid gap-4 medium:grid-cols-2">
        <TextField label="First name" autoComplete="given-name" error={errors.firstName?.message} {...form.register("firstName")} />
        <TextField label="Last name" autoComplete="family-name" error={errors.lastName?.message} {...form.register("lastName")} />
      </div>
      <TextField label="Email" value={email} readOnly disabled supportingText="Contact support to change the email on your account" />
      <TextField label="Phone" type="tel" autoComplete="tel" error={errors.phone?.message} {...form.register("phone")} />
      <Button type="submit" className="self-end" loading={isPending} disabled={!isDirty}>
        Save
      </Button>
    </form>
  );
}
