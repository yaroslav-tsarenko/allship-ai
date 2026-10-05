"use client";

import { useAction } from "next-safe-action/hooks";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog } from "@/components/ui/dialog";
import { PasswordField } from "@/components/ui/password-field";
import { SelectField } from "@/components/ui/select-field";
import { TextField } from "@/components/ui/text-field";
import { createUserAction } from "@/server/actions/admin-users";

const blank = { email: "", name: "", password: "", accountType: "shipper", role: "user", emailVerified: true };

function generatePassword() {
  const bytes = new Uint8Array(12);
  crypto.getRandomValues(bytes);
  return btoa(String.fromCharCode(...bytes)).replace(/[+/=]/g, "");
}

export function CreateUserDialog() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(blank);
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const { executeAsync, isPending } = useAction(createUserAction);

  const set = (patch: Partial<typeof blank>) => {
    setForm((f) => ({ ...f, ...patch }));
    setErrors({});
  };

  const submit = async () => {
    const res = await executeAsync({
      email: form.email.trim(),
      name: form.name.trim(),
      password: form.password,
      accountType: form.accountType as "shipper" | "carrier",
      role: form.role as "user" | "admin",
      emailVerified: form.emailVerified,
    });
    if (res?.serverError) return void toast.error(res.serverError);
    if (res?.validationErrors) {
      setErrors(res.validationErrors as Record<string, string[]>);
      return void toast.error("Check the form and try again.");
    }
    toast.success(`Created ${form.email.trim()}.`);
    setForm(blank);
    setOpen(false);
    router.refresh();
  };

  return (
    <>
      <Button onClick={() => setOpen(true)}>New user</Button>
      <Dialog
        open={open}
        onOpenChange={(next) => {
          setOpen(next);
          if (!next) {
            setForm(blank);
            setErrors({});
          }
        }}
        title="Create a user"
        description="The account is usable right away. Share the password with them over a secure channel."
        actions={
          <>
            <Button variant="text" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={submit} loading={isPending}>
              Create user
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-4">
          <TextField label="Full name" required value={form.name} error={errors.name?.[0]} onChange={(e) => set({ name: e.target.value })} />
          <TextField label="Email" type="email" required autoComplete="off" value={form.email} error={errors.email?.[0]} onChange={(e) => set({ email: e.target.value })} />
          <PasswordField
            label="Password"
            required
            autoComplete="new-password"
            value={form.password}
            error={errors.password?.[0]}
            supportingText="At least 10 characters."
            onChange={(e) => set({ password: e.target.value })}
          />
          <Button variant="text" className="self-start" onClick={() => set({ password: generatePassword() })}>
            Generate a password
          </Button>
          <SelectField
            label="Account type"
            value={form.accountType}
            options={[
              { value: "shipper", label: "Shipper" },
              { value: "carrier", label: "Carrier" },
            ]}
            onChange={(e) => set({ accountType: e.target.value })}
          />
          <SelectField
            label="Platform role"
            value={form.role}
            options={[
              { value: "user", label: "User" },
              { value: "admin", label: "Admin" },
            ]}
            supportingText="Admins also need two-step verification before they can open /admin."
            onChange={(e) => set({ role: e.target.value })}
          />
          <Checkbox label="Mark the email as confirmed" checked={form.emailVerified} onCheckedChange={(v) => set({ emailVerified: v === true })} />
        </div>
      </Dialog>
    </>
  );
}
