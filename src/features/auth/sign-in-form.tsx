"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useState, useSyncExternalStore, type ReactNode } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Divider } from "@/components/ui/divider";
import { Icon } from "@/components/ui/icon";
import { keyIcon, mailIcon, passkeyIcon } from "@/components/ui/icons.generated";
import { OtpField } from "@/components/ui/otp-field";
import { PasswordField } from "@/components/ui/password-field";
import { TextField } from "@/components/ui/text-field";
import { authClient } from "@/server/auth/client";
import { GoogleButton } from "./google-button";
import { captchaHeaders, Turnstile } from "./turnstile";
import { StepTransition } from "@/components/motion/step-transition";

const schema = z.object({
  email: z.email("Enter a valid email address"),
  password: z.string().min(1, "Enter your password"),
});
type Values = z.infer<typeof schema>;

type Mode = { kind: "password" } | { kind: "code"; email: string } | { kind: "link-sent"; email: string };

export function SignInForm({ next, googleEnabled }: { next: string; googleEnabled: boolean }) {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>({ kind: "password" });
  const [captcha, setCaptcha] = useState<string | null>(null);
  const [captchaReset, setCaptchaReset] = useState(0);
  const [busy, setBusy] = useState<null | "password" | "code" | "link" | "passkey" | "verify">(null);
  const [otp, setOtp] = useState("");
  const lastMethod = useSyncExternalStore(
    () => () => {},
    () => authClient.getLastUsedLoginMethod(),
    () => null,
  );
  const onToken = useCallback((t: string | null) => setCaptcha(t), []);

  const form = useForm<Values>({ resolver: zodResolver(schema), defaultValues: { email: "", password: "" } });

  const finish = () => {
    router.replace(next);
    router.refresh();
  };

  const fail = (message?: string) => {
    toast.error(message ?? "Something went wrong. Try again.");
    setCaptchaReset((n) => n + 1);
    setBusy(null);
  };

  const onPassword = form.handleSubmit(async ({ email, password }) => {
    setBusy("password");
    const { error } = await authClient.signIn.email(
      { email, password, callbackURL: next, rememberMe: true },
      captchaHeaders(captcha),
    );
    if (error) {
      if (error.code === "EMAIL_NOT_VERIFIED") {
        router.push(`/verify-email?email=${encodeURIComponent(email)}`);
        return;
      }
      return fail(error.status === 401 ? "Wrong email or password." : error.message);
    }
    finish();
  });

  const requireEmail = async () => {
    const valid = await form.trigger("email");
    return valid ? form.getValues("email") : null;
  };

  const onSendCode = async () => {
    const email = await requireEmail();
    if (!email) return;
    setBusy("code");
    const { error } = await authClient.emailOtp.sendVerificationOtp({ email, type: "sign-in" }, captchaHeaders(captcha));
    if (error) return fail(error.message);
    setBusy(null);
    setOtp("");
    setMode({ kind: "code", email });
  };

  const onVerifyCode = async (code: string) => {
    if (mode.kind !== "code" || code.length !== 6) return;
    setBusy("verify");
    const { error } = await authClient.signIn.emailOtp({ email: mode.email, otp: code });
    if (error) return fail(error.message ?? "That code did not work.");
    finish();
  };

  const onSendLink = async () => {
    const email = await requireEmail();
    if (!email) return;
    setBusy("link");
    const { error } = await authClient.signIn.magicLink({ email, callbackURL: next }, captchaHeaders(captcha));
    if (error) return fail(error.message);
    setBusy(null);
    setMode({ kind: "link-sent", email });
  };

  const onPasskey = async () => {
    setBusy("passkey");
    const { error } = await authClient.signIn.passkey();
    if (error) return fail(error.message ?? "No passkey was used.");
    finish();
  };

  const step = (node: ReactNode) => (
    <StepTransition stepKey={mode.kind} direction={mode.kind === "password" ? -1 : 1}>
      {node}
    </StepTransition>
  );

  if (mode.kind === "code") {
    return step(
      <div className="flex flex-col gap-6">
        <div>
          <p className="text-title-md text-on-surface">Enter the 6-digit code</p>
          <p className="mt-1 text-body-md text-on-surface-variant">
            We sent it to <span className="font-medium text-on-surface">{mode.email}</span>. It expires in 10 minutes.
          </p>
        </div>
        <OtpField label="Sign-in code" value={otp} onChange={setOtp} onComplete={onVerifyCode} />
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Button variant="text" onClick={() => setMode({ kind: "password" })}>
            Use another method
          </Button>
          <Button onClick={() => onVerifyCode(otp)} loading={busy === "verify"} disabled={otp.length !== 6}>
            Sign in
          </Button>
        </div>
      </div>
    );
  }

  if (mode.kind === "link-sent") {
    return step(
      <div className="flex flex-col gap-4">
        <Icon icon={mailIcon} size={40} className="animate-pop-in text-primary" />
        <p className="text-title-lg text-on-surface">Check your inbox</p>
        <p className="text-body-lg text-on-surface-variant">
          We sent a sign-in link to <span className="font-medium text-on-surface">{mode.email}</span>. Open it on this device. The link works once and expires in 10 minutes.
        </p>
        <Button variant="text" className="self-start" onClick={() => setMode({ kind: "password" })}>
          Back to sign in
        </Button>
      </div>
    );
  }

  return step(
    <div className="flex flex-col gap-5">
      {googleEnabled && <GoogleButton callbackURL={next} lastUsed={lastMethod === "google"} />}
      {googleEnabled && <Divider label="or" />}
      <form onSubmit={onPassword} className="flex flex-col gap-4" noValidate>
        <TextField label="Email" type="email" autoComplete="email webauthn" inputMode="email" autoFocus error={form.formState.errors.email?.message} {...form.register("email")} />
        <PasswordField label="Password" autoComplete="current-password" error={form.formState.errors.password?.message} {...form.register("password")} />
        <Link href="/forgot-password" className="self-start rounded-xs text-label-lg font-medium text-primary hover:underline">
          Forgot password?
        </Link>
        <Turnstile onToken={onToken} resetKey={captchaReset} />
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
          <Button variant="text" asChild>
            <Link href={`/sign-up${next !== "/app" ? `?next=${encodeURIComponent(next)}` : ""}`}>Create account</Link>
          </Button>
          <Button type="submit" loading={busy === "password"}>
            Sign in
          </Button>
        </div>
      </form>
      <Divider label="Other ways to sign in" />
      <div className="grid gap-2 medium:grid-cols-3">
        <Button variant="tonal" leading={<Icon icon={passkeyIcon} size={18} />} loading={busy === "passkey"} onClick={onPasskey}>
          Passkey
        </Button>
        <Button variant="tonal" leading={<Icon icon={keyIcon} size={18} />} loading={busy === "code"} onClick={onSendCode}>
          Email code
        </Button>
        <Button variant="tonal" leading={<Icon icon={mailIcon} size={18} />} loading={busy === "link"} onClick={onSendLink}>
          Email link
        </Button>
      </div>
    </div>
  );
}
