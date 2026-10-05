"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAction } from "next-safe-action/hooks";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Icon } from "@/components/ui/icon";
import { chevronRightIcon, deleteIcon, downloadIcon } from "@/components/ui/icons.generated";
import { PasswordField } from "@/components/ui/password-field";
import { TextField } from "@/components/ui/text-field";
import type { DeletionBlocker } from "@/server/account/blockers";
import { deleteAccount } from "@/server/actions/account";

export function PrivacyPanel({ blockers, hasPassword }: { blockers: DeletionBlocker[]; hasPassword: boolean }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const { executeAsync, isPending } = useAction(deleteAccount);
  const blocked = blockers.length > 0;

  const submit = async () => {
    const result = await executeAsync({ confirmation, password: hasPassword ? password : undefined });
    if (result?.serverError) return toast.error(result.serverError);
    if (result?.validationErrors) return toast.error("Check the form and try again.");
    toast("Your account was deleted.");
    router.replace("/");
    router.refresh();
  };

  return (
    <div className="flex flex-col">
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-outline-variant pb-5">
        <div className="max-w-[480px]">
          <h3 className="text-title-md">Download my data</h3>
          <p className="mt-1 text-body-md text-on-surface-variant">
            A JSON file with your profile, loads, bids, messages you sent, reviews, notifications and assistant conversations. You can download it 3 times an hour.
          </p>
        </div>
        <Button variant="outlined" asChild>
          <a href="/api/account/export" download>
            <Icon icon={downloadIcon} size={18} />
            Download
          </a>
        </Button>
      </div>

      <div className="pt-5">
        <h3 className="text-title-md text-error">Delete account</h3>
        <p className="mt-1 max-w-[560px] text-body-md text-on-surface-variant">
          We remove your name, email, phone, sign-in methods, assistant conversations and notifications. Completed loads, payments and reviews stay on record without your personal details, as tax and dispute rules require. This can&apos;t be undone.
        </p>
        {blocked && (
          <div className="mt-4 border-l-2 border-error pl-4">
            <p className="text-title-sm">Resolve these first</p>
            <ul className="mt-2 flex flex-col gap-3">
              {blockers.map((b) => (
                <li key={b.code + b.title}>
                  <p className="text-body-md text-on-surface">{b.title}</p>
                  <p className="text-body-sm text-on-surface-variant">{b.detail}</p>
                  {b.href && (
                    <Link href={b.href} className="mt-1 inline-flex items-center gap-1 text-label-lg text-primary">
                      Open
                      <Icon icon={chevronRightIcon} size={18} />
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}
        <Button variant="danger" className="mt-4" disabled={blocked} onClick={() => setOpen(true)}>
          <Icon icon={deleteIcon} size={18} />
          Delete account
        </Button>
      </div>

      <Dialog
        open={open}
        onOpenChange={(o) => {
          setOpen(o);
          if (!o) {
            setPassword("");
            setConfirmation("");
          }
        }}
        title="Delete your account?"
        description={
          hasPassword
            ? "Enter your password and type DELETE. You'll be signed out on every device."
            : "Type DELETE to confirm. If you signed in more than 10 minutes ago, we'll ask you to sign in again first."
        }
        actions={
          <>
            <Button variant="text" onClick={() => setOpen(false)}>
              Keep account
            </Button>
            <Button variant="danger" loading={isPending} disabled={confirmation.trim().toUpperCase() !== "DELETE" || (hasPassword && !password)} onClick={submit}>
              Delete permanently
            </Button>
          </>
        }
      >
        {hasPassword && <PasswordField label="Password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} autoFocus />}
        <TextField label="Type DELETE" value={confirmation} onChange={(e) => setConfirmation(e.target.value)} autoComplete="off" autoCapitalize="characters" spellCheck={false} />
      </Dialog>
    </div>
  );
}
