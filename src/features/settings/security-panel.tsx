"use client";

import Image from "next/image";
import QRCode from "qrcode";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog } from "@/components/ui/dialog";
import { Icon } from "@/components/ui/icon";
import { IconButton } from "@/components/ui/icon-button";
import { closeIcon, contentCopyIcon, passkeyIcon, shieldLockIcon } from "@/components/ui/icons.generated";
import { OtpField } from "@/components/ui/otp-field";
import { PasswordField } from "@/components/ui/password-field";
import { authClient } from "@/server/auth/client";

type SessionRow = { id: string; token: string; userAgent?: string | null; ipAddress?: string | null; createdAt: Date; updatedAt: Date };

function describeAgent(ua?: string | null) {
  if (!ua) return "Unknown device";
  const browser = /Edg\//.test(ua) ? "Edge" : /Chrome\//.test(ua) ? "Chrome" : /Firefox\//.test(ua) ? "Firefox" : /Safari\//.test(ua) ? "Safari" : "Browser";
  const os = /iPhone|iPad/.test(ua) ? "iOS" : /Android/.test(ua) ? "Android" : /Mac OS X/.test(ua) ? "macOS" : /Windows/.test(ua) ? "Windows" : /Linux/.test(ua) ? "Linux" : "";
  return os ? `${browser} on ${os}` : browser;
}

const dateFmt = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" });

function Section({ title, description, children }: { title: string; description: string; children: React.ReactNode }) {
  return (
    <Card as="section" className="p-6">
      <h2 className="text-title-lg">{title}</h2>
      <p className="mt-1 text-body-md text-on-surface-variant">{description}</p>
      <div className="mt-5">{children}</div>
    </Card>
  );
}

function ChangePassword({ hasPassword }: { hasPassword: boolean }) {
  const [open, setOpen] = useState(false);
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [busy, setBusy] = useState(false);

  if (!hasPassword) {
    return <p className="text-body-md text-on-surface-variant">You sign in with Google, a passkey or an email code. To add a password, use “Forgot password” on the sign-in page.</p>;
  }

  const submit = async () => {
    if (next.length < 10) return toast.error("Use at least 10 characters");
    setBusy(true);
    const { error } = await authClient.changePassword({ currentPassword: current, newPassword: next, revokeOtherSessions: true });
    setBusy(false);
    if (error) return toast.error(error.message ?? "Could not change the password.");
    toast("Password changed. Other devices were signed out.");
    setOpen(false);
    setCurrent("");
    setNext("");
  };

  return (
    <>
      <Button variant="outlined" onClick={() => setOpen(true)}>
        Change password
      </Button>
      <Dialog
        open={open}
        onOpenChange={setOpen}
        title="Change password"
        description="Changing your password signs you out on your other devices."
        actions={
          <>
            <Button variant="text" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={submit} loading={busy}>
              Change password
            </Button>
          </>
        }
      >
        <PasswordField label="Current password" autoComplete="current-password" value={current} onChange={(e) => setCurrent(e.target.value)} />
        <PasswordField label="New password" autoComplete="new-password" value={next} onChange={(e) => setNext(e.target.value)} supportingText="At least 10 characters with a letter and a number" />
      </Dialog>
    </>
  );
}

function TwoFactor({ enabled, hasPassword }: { enabled: boolean; hasPassword: boolean }) {
  const router = useRouter();
  const [step, setStep] = useState<"idle" | "password" | "scan" | "disable">("idle");
  const [password, setPassword] = useState("");
  const [qr, setQr] = useState<string | null>(null);
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);

  const start = async () => {
    setBusy(true);
    const { data, error } = await authClient.twoFactor.enable({ password });
    setBusy(false);
    if (error || !data) return toast.error(error?.message ?? "Wrong password.");
    if (data.method !== "totp") return toast.error("Authenticator setup is not available.");
    setQr(await QRCode.toDataURL(data.totpURI, { margin: 1, width: 200 }));
    setBackupCodes(data.backupCodes);
    setStep("scan");
  };

  const confirm = async (value: string) => {
    if (value.length !== 6) return;
    setBusy(true);
    const { error } = await authClient.twoFactor.verifyTotp({ code: value });
    setBusy(false);
    if (error) {
      setCode("");
      return toast.error("That code did not work. Use the newest code from your app.");
    }
    toast("2-Step Verification is on");
    setStep("idle");
    router.refresh();
  };

  const disable = async () => {
    setBusy(true);
    const { error } = await authClient.twoFactor.disable({ password });
    setBusy(false);
    if (error) return toast.error(error.message ?? "Wrong password.");
    toast("2-Step Verification is off");
    setStep("idle");
    router.refresh();
  };

  if (!hasPassword && !enabled) {
    return <p className="text-body-md text-on-surface-variant">Set a password first to use an authenticator app. Passkeys below work without a password.</p>;
  }

  return (
    <>
      <div className="flex flex-wrap items-center gap-4">
        <span className={`inline-flex items-center gap-2 rounded-sm px-3 py-1.5 text-label-lg ${enabled ? "bg-success-container text-on-success-container" : "bg-surface-container-highest text-on-surface-variant"}`}>
          <Icon icon={shieldLockIcon} size={18} filled={enabled} />
          {enabled ? "On" : "Off"}
        </span>
        {enabled ? (
          <Button variant="text" onClick={() => setStep("disable")}>
            Turn off
          </Button>
        ) : (
          <Button onClick={() => setStep("password")}>Turn on</Button>
        )}
      </div>
      <Dialog
        open={step === "password" || step === "disable"}
        onOpenChange={(o) => !o && setStep("idle")}
        title={step === "disable" ? "Turn off 2-Step Verification" : "Confirm it's you"}
        description={step === "disable" ? "Your account will be protected by your password only." : "Enter your password to set up an authenticator app."}
        actions={
          <>
            <Button variant="text" onClick={() => setStep("idle")}>
              Cancel
            </Button>
            <Button variant={step === "disable" ? "danger" : "filled"} loading={busy} onClick={step === "disable" ? disable : start}>
              {step === "disable" ? "Turn off" : "Next"}
            </Button>
          </>
        }
      >
        <PasswordField label="Password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} autoFocus />
      </Dialog>
      <Dialog open={step === "scan"} onOpenChange={(o) => !o && setStep("idle")} title="Set up your authenticator app" description="Scan the QR code with Google Authenticator, 1Password or another app, then enter the 6-digit code it shows.">
        {qr && <Image src={qr} alt="QR code for your authenticator app" width={200} height={200} unoptimized className="self-center rounded-md bg-white p-2" />}
        <OtpField label="Authenticator code" value={code} onChange={setCode} onComplete={confirm} />
        <div className="rounded-md bg-surface-container p-4">
          <div className="flex items-center justify-between">
            <p className="text-title-sm">Backup codes</p>
            <IconButton
              icon={contentCopyIcon}
              label="Copy backup codes"
              onClick={async () => {
                await navigator.clipboard.writeText(backupCodes.join("\n"));
                toast("Backup codes copied");
              }}
            />
          </div>
          <p className="mb-3 text-body-sm text-on-surface-variant">Save these somewhere safe. Each one signs you in once if you lose your phone.</p>
          <ul className="grid grid-cols-2 gap-x-6 gap-y-1 font-mono text-body-md">
            {backupCodes.map((c) => (
              <li key={c}>{c}</li>
            ))}
          </ul>
        </div>
        <div className="flex justify-end">
          <Button loading={busy} disabled={code.length !== 6} onClick={() => confirm(code)}>
            Verify and turn on
          </Button>
        </div>
      </Dialog>
    </>
  );
}

function Passkeys() {
  const { data, refetch, isPending } = authClient.useListPasskeys();
  const [busy, setBusy] = useState(false);

  const add = async () => {
    setBusy(true);
    const result = await authClient.passkey.addPasskey({ name: describeAgent(navigator.userAgent) });
    setBusy(false);
    if (result?.error) return toast.error(result.error.message ?? "The passkey was not created.");
    toast("Passkey added");
    refetch();
  };

  const remove = async (id: string) => {
    const { error } = await authClient.passkey.deletePasskey({ id });
    if (error) return toast.error(error.message ?? "Could not remove the passkey.");
    refetch();
  };

  return (
    <div className="flex flex-col gap-3">
      {!isPending && (data?.length ?? 0) === 0 && <p className="text-body-md text-on-surface-variant">No passkeys yet. A passkey lets you sign in with your fingerprint, face or screen lock.</p>}
      {data && data.length > 0 && (
        <ul className="divide-y divide-outline-variant rounded-md border border-outline-variant">
          {data.map((p) => (
            <li key={p.id} className="flex items-center gap-4 px-4 py-3">
              <Icon icon={passkeyIcon} className="text-on-surface-variant" />
              <span className="flex-1">
                <span className="block text-body-lg">{p.name ?? "Passkey"}</span>
                <span className="block text-body-sm text-on-surface-variant">Added {dateFmt.format(new Date(p.createdAt))}</span>
              </span>
              <IconButton icon={closeIcon} label={`Remove ${p.name ?? "passkey"}`} onClick={() => remove(p.id)} />
            </li>
          ))}
        </ul>
      )}
      <Button variant="outlined" className="self-start" leading={<Icon icon={passkeyIcon} size={18} />} loading={busy} onClick={add}>
        Create a passkey
      </Button>
    </div>
  );
}

function Devices({ currentToken }: { currentToken: string }) {
  const [sessions, setSessions] = useState<SessionRow[] | null>(null);
  const [version, setVersion] = useState(0);

  useEffect(() => {
    let active = true;
    authClient.listSessions().then(({ data }) => {
      if (active) setSessions((data as SessionRow[] | null) ?? []);
    });
    return () => {
      active = false;
    };
  }, [version]);

  const revokeOthers = async () => {
    const { error } = await authClient.revokeOtherSessions();
    if (error) return toast.error(error.message ?? "Could not sign out other devices.");
    toast("Signed out of other devices");
    setVersion((v) => v + 1);
  };

  return (
    <div className="flex flex-col gap-3">
      <ul className="divide-y divide-outline-variant rounded-md border border-outline-variant">
        {(sessions ?? []).map((s) => (
          <li key={s.id} className="flex items-center gap-4 px-4 py-3">
            <span className="flex-1">
              <span className="block text-body-lg">
                {describeAgent(s.userAgent)}
                {s.token === currentToken && <span className="ml-2 rounded-sm bg-primary-container px-2 py-0.5 text-label-sm text-on-primary-container">This device</span>}
              </span>
              <span className="block text-body-sm text-on-surface-variant">Last active {dateFmt.format(new Date(s.updatedAt))}</span>
            </span>
          </li>
        ))}
        {sessions === null && <li className="px-4 py-3 text-body-md text-on-surface-variant">Loading devices…</li>}
      </ul>
      {sessions && sessions.length > 1 && (
        <Button variant="outlined" className="self-start" onClick={revokeOthers}>
          Sign out of all other devices
        </Button>
      )}
    </div>
  );
}

export function SecurityPanel({ twoFactorEnabled, hasPassword, currentToken, requireTwoFactor }: { twoFactorEnabled: boolean; hasPassword: boolean; currentToken: string; requireTwoFactor: boolean }) {
  return (
    <div className="flex flex-col gap-6">
      {requireTwoFactor && !twoFactorEnabled && (
        <div role="alert" className="rounded-md bg-error-container px-5 py-4 text-body-md text-on-error-container">
          Staff accounts must turn on 2-Step Verification before opening the admin console.
        </div>
      )}
      <Section title="Password" description="Use a password you don't use on any other site.">
        <ChangePassword hasPassword={hasPassword} />
      </Section>
      <Section title="2-Step Verification" description="After your password, enter a code from an authenticator app.">
        <TwoFactor enabled={twoFactorEnabled} hasPassword={hasPassword} />
      </Section>
      <Section title="Passkeys" description="Sign in with your fingerprint, face or screen lock instead of a password.">
        <Passkeys />
      </Section>
      <Section title="Your devices" description="Where you're signed in to AllShip AI right now.">
        <Devices currentToken={currentToken} />
      </Section>
    </div>
  );
}
