"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { OtpField } from "@/components/ui/otp-field";
import { TextField } from "@/components/ui/text-field";
import { authClient } from "@/server/auth/client";
import { StepTransition } from "@/components/motion/step-transition";

export function TwoFactorForm() {
  const router = useRouter();
  const [mode, setMode] = useState<"totp" | "backup">("totp");
  const [code, setCode] = useState("");
  const [backup, setBackup] = useState("");
  const [trust, setTrust] = useState(true);
  const [busy, setBusy] = useState(false);

  const done = () => {
    router.replace("/app");
    router.refresh();
  };

  const verifyTotp = async (value: string) => {
    if (value.length !== 6) return;
    setBusy(true);
    const { error } = await authClient.twoFactor.verifyTotp({ code: value, trustDevice: trust });
    setBusy(false);
    if (error) {
      setCode("");
      toast.error("That code did not work. Use the newest code from your app.");
      return;
    }
    done();
  };

  const verifyBackup = async () => {
    setBusy(true);
    const { error } = await authClient.twoFactor.verifyBackupCode({ code: backup.trim(), trustDevice: trust });
    setBusy(false);
    if (error) {
      toast.error("That backup code did not work.");
      return;
    }
    done();
  };

  return (
    <div className="flex flex-col gap-6">
      <StepTransition stepKey={mode} direction={mode === "backup" ? 1 : -1} className="flex flex-col gap-6">
        {mode === "totp" ? (
          <>
            <p className="text-body-lg text-on-surface-variant">Open your authenticator app and enter the 6-digit code for AllShip AI.</p>
            <OtpField label="Authenticator code" value={code} onChange={setCode} onComplete={verifyTotp} />
          </>
        ) : (
          <TextField label="Backup code" autoComplete="one-time-code" value={backup} onChange={(e) => setBackup(e.target.value)} autoFocus supportingText="Each backup code works once" />
        )}
      </StepTransition>
      <Checkbox checked={trust} onCheckedChange={(v) => setTrust(v === true)} label="Don't ask again on this device for 30 days" />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Button variant="text" onClick={() => setMode(mode === "totp" ? "backup" : "totp")}>
          {mode === "totp" ? "Use a backup code" : "Use authenticator app"}
        </Button>
        <Button loading={busy} onClick={() => (mode === "totp" ? verifyTotp(code) : verifyBackup())} disabled={mode === "totp" ? code.length !== 6 : backup.trim().length < 8}>
          Verify
        </Button>
      </div>
    </div>
  );
}
