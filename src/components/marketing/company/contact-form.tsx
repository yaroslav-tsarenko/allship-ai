"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useAction } from "next-safe-action/hooks";
import { useCallback, useEffect, useId, useState, type ReactNode } from "react";
import { useForm, useWatch } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { checkIcon, sendIcon } from "@/components/ui/icons.generated";
import { TextField } from "@/components/ui/text-field";
import { Turnstile } from "@/features/auth/turnstile";
import { track } from "@/lib/analytics";
import { cn } from "@/lib/cn";
import { submitContact } from "@/server/marketing/contact";

const contactTopics = [
  { value: "shipping", label: "A shipment or quote", reply: "Got it. If it's about a load you already posted, put the load ID (it starts with AS-) in your message so we can open it right away." },
  { value: "carrier", label: "Carriers and dispatch", reply: "Happy to help. For verification questions, include your USDOT and MC numbers so we can look up your authority." },
  { value: "billing", label: "Payments and billing", reply: "Okay. Tell us which load the payment is for and what you expected to happen. Never send full card numbers by message." },
  { value: "other", label: "Something else", reply: "Sure. Tell us what's on your mind." },
] as const;

export type ContactTopic = (typeof contactTopics)[number]["value"];

const schema = z.object({
  name: z.string().trim().min(2, "Enter your name"),
  email: z.email("Enter a valid email address"),
  phone: z
    .string()
    .trim()
    .max(32, "That phone number is too long")
    .regex(/^[0-9+()\-.\s]*$/, "Use digits, spaces and + ( ) - only")
    .optional(),
  topic: z.enum(["shipping", "carrier", "billing", "other"]),
  message: z.string().trim().min(20, "Tell us a little more, at least 20 characters").max(2000, "Keep it under 2,000 characters"),
});
type Values = z.infer<typeof schema>;

function Said({ children, mark }: { children: ReactNode; mark: ReactNode }) {
  return (
    <li className="flex items-end gap-3 pr-6 medium:pr-16">
      <span aria-hidden="true" className="mb-1 flex size-8 shrink-0 items-center justify-center rounded-full bg-primary text-on-primary">
        {mark}
      </span>
      <div className="animate-message-in rounded-[20px] rounded-bl-xs bg-surface px-4 py-3 text-body-lg text-pretty text-on-surface">{children}</div>
    </li>
  );
}

function Reply({ children, label }: { children: ReactNode; label: string }) {
  return (
    <li className="flex flex-col items-end pl-6 medium:pl-16">
      <span className="sr-only">{label}</span>
      <div className="w-full">{children}</div>
    </li>
  );
}

function Spark() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden="true">
      <path d="M12 2.5c.32 0 .6.22.68.53.53 2.08 1.39 3.8 2.6 5.03 1.2 1.22 2.93 2.08 5.03 2.62a.7.7 0 0 1 0 1.36c-2.1.54-3.82 1.4-5.03 2.62-1.21 1.22-2.07 2.95-2.6 5.03a.7.7 0 0 1-1.36 0c-.53-2.08-1.39-3.8-2.6-5.03-1.2-1.22-2.93-2.08-5.03-2.62a.7.7 0 0 1 0-1.36c2.1-.54 3.82-1.4 5.03-2.62 1.21-1.22 2.07-2.95 2.6-5.03A.7.7 0 0 1 12 2.5Z" />
    </svg>
  );
}

export function ContactForm({ defaultTopic = "shipping", topicFromUrl = false }: { defaultTopic?: ContactTopic; topicFromUrl?: boolean }) {
  const ids = useId();
  const [token, setToken] = useState<string | null>(null);
  const [resetKey, setResetKey] = useState(0);
  const [sent, setSent] = useState<{ email: string; name: string } | null>(null);
  const onToken = useCallback((t: string | null) => setToken(t), []);
  const { executeAsync, isPending, result, reset } = useAction(submitContact);

  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { name: "", email: "", phone: "", topic: defaultTopic, message: "" },
  });
  const { errors } = form.formState;

  useEffect(() => {
    if (!topicFromUrl) return;
    const requested = new URLSearchParams(window.location.search).get("topic");
    const match = contactTopics.find((t) => t.value === requested);
    if (match) form.setValue("topic", match.value);
  }, [topicFromUrl, form]);
  const messageLength = useWatch({ control: form.control, name: "message" })?.length ?? 0;
  const topicValue = useWatch({ control: form.control, name: "topic" });
  const topic = contactTopics.find((t) => t.value === topicValue) ?? contactTopics[0];

  const onSubmit = form.handleSubmit(async (values) => {
    const res = await executeAsync({ ...values, phone: values.phone || undefined, turnstileToken: token ?? undefined });
    if (res?.data?.ok) {
      track("contact_submitted", { topic: values.topic });
      setSent({ email: values.email, name: values.name.split(/\s+/)[0] ?? values.name });
      form.reset({ name: "", email: "", phone: "", topic: values.topic, message: "" });
    } else {
      setResetKey((n) => n + 1);
    }
  });

  const shell = "rounded-xl bg-surface-container-low p-4 medium:p-6 [--field-bg:var(--md-surface-container-low)]";

  if (sent) {
    return (
      <div className={shell}>
        <ol className="flex flex-col gap-4" role="status">
          <Said mark={<Spark />}>
            Thanks, {sent.name}. Your message is in. We&apos;ll write back to <span className="font-medium">{sent.email}</span>.
          </Said>
          <Said mark={<Spark />}>If it&apos;s about an active load and can&apos;t wait, calling is the fastest way to reach us.</Said>
        </ol>
        <div className="mt-6 flex justify-end">
          <Button
            variant="outlined"
            onClick={() => {
              reset();
              setSent(null);
            }}
          >
            Send another message
          </Button>
        </div>
      </div>
    );
  }

  const messageId = `${ids}-message`;

  return (
    <form onSubmit={onSubmit} noValidate className={shell} aria-describedby={`${ids}-note`}>
      <ol className="flex flex-col gap-5">
        <Said mark={<Spark />}>Hi, this is AllShip support. What can we help with?</Said>
        <Reply label="Your answer: topic">
          <fieldset>
            <legend className="sr-only">Topic</legend>
            <div className="flex flex-wrap justify-end gap-2">
              {contactTopics.map((t) => (
                <label
                  key={t.value}
                  className="state-layer relative inline-flex min-h-10 cursor-pointer items-center gap-2 rounded-sm border border-outline-variant bg-surface px-4 text-label-lg font-medium text-on-surface-variant transition-colors duration-(--duration-short4) ease-standard has-[:checked]:border-transparent has-[:checked]:bg-secondary-container has-[:checked]:text-on-secondary-container has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-primary"
                >
                  <input type="radio" value={t.value} className="sr-only" {...form.register("topic")} />
                  {t.value === topicValue && <Icon icon={checkIcon} size={18} />}
                  {t.label}
                </label>
              ))}
            </div>
          </fieldset>
        </Reply>
        <Said key={topic.value} mark={<Spark />}>
          {topic.reply}
        </Said>
        <Reply label="Your answer: message">
          <div className="flex flex-col gap-1">
            <div className="relative">
              <label htmlFor={messageId} className={cn("absolute -top-2 left-3 bg-[var(--field-bg)] px-1 text-body-sm", errors.message ? "text-error" : "text-on-surface-variant")}>
                Your message<span aria-hidden="true"> *</span>
              </label>
              <textarea
                id={messageId}
                rows={5}
                required
                maxLength={2000}
                aria-invalid={errors.message ? true : undefined}
                aria-describedby={`${messageId}-help`}
                className={cn(
                  "block w-full resize-y rounded-[20px] rounded-br-xs border bg-surface px-4 py-4 text-body-lg text-on-surface outline-none",
                  errors.message ? "border-error focus:border-2 focus:border-error" : "border-outline hover:border-on-surface focus:border-2 focus:border-primary",
                )}
                {...form.register("message")}
              />
            </div>
            <p id={`${messageId}-help`} className={cn("flex justify-between gap-4 px-4 text-body-sm", errors.message ? "text-error" : "text-on-surface-variant")} role={errors.message ? "alert" : undefined}>
              <span>{errors.message?.message ?? "At least 20 characters."}</span>
              <span className="shrink-0 font-mono tabular-nums">{messageLength}/2000</span>
            </p>
          </div>
        </Reply>
        <Said mark={<Spark />}>Where should we send the answer?</Said>
        <Reply label="Your answer: contact details">
          <div className="grid gap-4 medium:grid-cols-2">
            <TextField label="Name" autoComplete="name" required error={errors.name?.message} {...form.register("name")} />
            <TextField label="Email" type="email" autoComplete="email" required error={errors.email?.message} {...form.register("email")} />
            <TextField label="Phone (optional)" type="tel" autoComplete="tel" error={errors.phone?.message} className="medium:col-span-2" {...form.register("phone")} />
          </div>
        </Reply>
      </ol>

      <div className="mt-5">
        <Turnstile onToken={onToken} resetKey={resetKey} />
      </div>

      {result.serverError && (
        <p role="alert" className="mt-4 rounded-sm bg-error-container px-4 py-3 text-body-md text-on-error-container">
          {result.serverError}
        </p>
      )}
      {result.validationErrors && !result.serverError && (
        <p role="alert" className="mt-4 rounded-sm bg-error-container px-4 py-3 text-body-md text-on-error-container">
          Some fields need another look. Check the form and try again.
        </p>
      )}

      <div className="mt-6 flex flex-col gap-4 border-t border-outline-variant pt-5 medium:flex-row medium:items-center medium:justify-between">
        <p id={`${ids}-note`} className="max-w-[420px] text-body-sm text-on-surface-variant">
          We use your details only to answer this message, as described in our{" "}
          <Link href="/privacy-policy" className="text-primary underline-offset-4 hover:underline">
            privacy policy
          </Link>
          .
        </p>
        <Button type="submit" size="lg" loading={isPending} trailing={<Icon icon={sendIcon} size={18} />}>
          Send message
        </Button>
      </div>
    </form>
  );
}
