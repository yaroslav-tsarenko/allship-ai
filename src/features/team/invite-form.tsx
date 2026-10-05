"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useAction } from "next-safe-action/hooks";
import { Controller, useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { sendIcon } from "@/components/ui/icons.generated";
import { SegmentedButton } from "@/components/ui/segmented-button";
import { TextField } from "@/components/ui/text-field";
import { inviteMemberAction } from "@/server/actions/team";
import { roleMeta } from "./roles";

const schema = z.object({
  email: z.email("Enter a valid email address"),
  role: z.enum(["driver", "dispatcher"]),
});
type Values = z.infer<typeof schema>;

export function InviteForm({ canInviteDispatchers }: { canInviteDispatchers: boolean }) {
  const form = useForm<Values>({ resolver: zodResolver(schema), defaultValues: { email: "", role: "driver" } });
  const { executeAsync, isPending } = useAction(inviteMemberAction);
  const role = useWatch({ control: form.control, name: "role" });

  const onSubmit = form.handleSubmit(async (values) => {
    const result = await executeAsync(values);
    if (result?.serverError) {
      form.setError("email", { message: result.serverError });
      return;
    }
    if (result?.validationErrors) {
      form.setError("email", { message: "Enter a valid email address" });
      return;
    }
    toast(`Invitation sent to ${values.email}`);
    form.reset({ email: "", role: values.role });
  });

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
      {canInviteDispatchers && (
        <Controller
          control={form.control}
          name="role"
          render={({ field }) => (
            <SegmentedButton
              label="Role"
              value={field.value}
              onChange={field.onChange}
              options={[
                { value: "driver", label: "Driver" },
                { value: "dispatcher", label: "Dispatcher" },
              ]}
            />
          )}
        />
      )}
      <p className="-mt-1 px-1 text-body-sm text-on-surface-variant">{roleMeta[role].blurb}.</p>
      <div className="flex flex-col gap-3 medium:flex-row medium:items-start">
        <TextField
          label="Email address"
          type="email"
          autoComplete="off"
          inputMode="email"
          className="min-w-0 flex-1"
          error={form.formState.errors.email?.message}
          {...form.register("email")}
        />
        <Button type="submit" size="lg" loading={isPending} leading={<Icon icon={sendIcon} size={20} />} className="medium:self-start">
          Send invite
        </Button>
      </div>
    </form>
  );
}
