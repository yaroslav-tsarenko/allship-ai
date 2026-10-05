"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useAction } from "next-safe-action/hooks";
import { useRouter } from "next/navigation";
import { useId, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Button, type ButtonProps } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Icon } from "@/components/ui/icon";
import { personAddIcon } from "@/components/ui/icons.generated";
import { TextArea } from "@/components/ui/text-area";
import { TextField } from "@/components/ui/text-field";
import { addDriverSchema, type AddDriverValues } from "@/features/fleet/schema";
import { addDriverAction } from "@/server/actions/fleet";

const empty: AddDriverValues = { name: "", email: "", phone: "", cdl: "", notes: "" };

export function AddDriverButton({
  variant = "filled",
  onAdded,
  className,
}: {
  variant?: ButtonProps["variant"];
  onAdded?: () => void;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const formId = useId();
  const router = useRouter();
  const form = useForm<AddDriverValues>({ resolver: zodResolver(addDriverSchema), defaultValues: empty });
  const { executeAsync, isPending } = useAction(addDriverAction);
  const errors = form.formState.errors;

  const onSubmit = form.handleSubmit(async (values) => {
    const result = await executeAsync(values);
    if (result?.serverError) {
      form.setError("email", { message: result.serverError });
      return;
    }
    if (result?.validationErrors || !result?.data) {
      toast.error("Check the highlighted fields and try again.");
      return;
    }
    const data = result.data;
    if (data.kind === "invited") {
      toast(
        `${data.email} already has an AllShip AI account. We sent them an invitation to join as a driver.`,
      );
    } else if (data.emailSent) {
      toast(`${data.name} was added. We emailed them a link to set up their account.`);
    } else {
      toast.error(
        `${data.name} was added, but the setup email didn't go out. Use “Resend setup link” on the Fleet page.`,
      );
    }
    form.reset(empty);
    setOpen(false);
    onAdded?.();
    router.refresh();
  });

  return (
    <>
      <Button
        variant={variant}
        className={className}
        leading={<Icon icon={personAddIcon} size={20} />}
        onClick={() => setOpen(true)}
      >
        Add driver
      </Button>
      <Dialog
        open={open}
        onOpenChange={(next) => {
          setOpen(next);
          if (!next) form.reset(empty);
        }}
        title="Add a driver"
        description="We create their account and email a link to sign in on their phone. If the email already has an account, they get an invitation to accept instead."
        actions={
          <>
            <Button variant="text" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" form={formId} loading={isPending}>
              Add driver
            </Button>
          </>
        }
      >
        <form id={formId} onSubmit={onSubmit} noValidate className="flex flex-col gap-3">
          <TextField
            label="Full name"
            autoComplete="off"
            required
            error={errors.name?.message}
            {...form.register("name")}
          />
          <TextField
            label="Email"
            type="email"
            inputMode="email"
            autoComplete="off"
            required
            error={errors.email?.message}
            {...form.register("email")}
          />
          <TextField
            label="Mobile phone"
            type="tel"
            inputMode="tel"
            autoComplete="off"
            required
            error={errors.phone?.message}
            supportingText="Dispatch uses this to call the driver on the road."
            {...form.register("phone")}
          />
          <TextField
            label="CDL number (optional)"
            autoComplete="off"
            error={errors.cdl?.message}
            {...form.register("cdl")}
          />
          <TextArea
            label="Notes (optional)"
            rows={2}
            maxLength={500}
            error={errors.notes?.message}
            supportingText="Only your team sees this."
            {...form.register("notes")}
          />
        </form>
      </Dialog>
    </>
  );
}
