"use client";

import { useAction } from "next-safe-action/hooks";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Icon } from "@/components/ui/icon";
import { arrowBackIcon, arrowForwardIcon, checkIcon, keyboardArrowDownIcon, lockIcon } from "@/components/ui/icons.generated";
import { TextField } from "@/components/ui/text-field";
import { categories, categoryGroups, type CategoryGroup } from "@/content/categories";
import { site } from "@/content/site";
import { Turnstile } from "@/features/auth/turnstile";
import { track } from "@/lib/analytics";
import { cn } from "@/lib/cn";
import { submitQuote } from "@/server/marketing/quote";
import { heavyEquipmentFields, quoteFields, type QuoteField } from "./fields";
import { StepTransition } from "@/components/motion/step-transition";

type Draft = {
  category: string;
  from: string;
  to: string;
  date: string;
  flexible: boolean;
  details: Record<string, string>;
  notes: string;
  name: string;
  email: string;
  phone: string;
  marketingOptIn: boolean;
};

const STORAGE_KEY = "allship-quote-draft";
const steps = ["What", "Where and when", "Details", "Contact"] as const;
const groups = Object.keys(categoryGroups) as CategoryGroup[];

const empty: Draft = { category: "", from: "", to: "", date: "", flexible: true, details: {}, notes: "", name: "", email: "", phone: "", marketingOptIn: false };

function fieldsFor(slug: string): QuoteField[] {
  const c = categories.find((x) => x.slug === slug);
  if (!c) return [];
  return c.key === "heavy_equipment" ? heavyEquipmentFields : quoteFields[c.group];
}

export function QuoteFlow({ initial, source }: { initial: Partial<Draft>; source: string }) {
  const router = useRouter();
  const [draft, setDraft] = useState<Draft>({ ...empty, ...initial });
  const [step, setStep] = useState(initial.category ? (initial.from && initial.to ? 2 : 1) : 0);
  const [direction, setDirection] = useState<1 | -1>(1);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [captcha, setCaptcha] = useState<string | null>(null);
  const onToken = useCallback((t: string | null) => setCaptcha(t), []);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const restored = useRef(false);
  const { executeAsync, isPending, result } = useAction(submitQuote);

  useEffect(() => {
    if (restored.current) return;
    restored.current = true;
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const saved = JSON.parse(raw) as Partial<Draft>;
      window.setTimeout(() => setDraft((d) => ({ ...d, ...saved, ...Object.fromEntries(Object.entries(initial).filter(([, v]) => v)) })), 0);
    } catch {}
  }, [initial]);

  useEffect(() => {
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(draft));
    } catch {}
  }, [draft]);

  useEffect(() => {
    headingRef.current?.focus();
  }, [step]);

  const category = useMemo(() => categories.find((c) => c.slug === draft.category), [draft.category]);
  const fields = useMemo(() => fieldsFor(draft.category), [draft.category]);
  const set = <K extends keyof Draft>(key: K, value: Draft[K]) => setDraft((d) => ({ ...d, [key]: value }));
  const setDetail = (name: string, value: string) => setDraft((d) => ({ ...d, details: { ...d.details, [name]: value } }));

  const validate = (s: number) => {
    const e: Record<string, string> = {};
    if (s === 0 && !draft.category) e.category = "Choose what you're shipping";
    if (s === 1) {
      if (draft.from.trim().length < 2) e.from = "Enter a pickup city or ZIP";
      if (draft.to.trim().length < 2) e.to = "Enter a delivery city or ZIP";
    }
    if (s === 2) for (const f of fields) if (f.required && !draft.details[f.name]?.trim()) e[f.name] = f.kind === "select" ? "Choose one option" : `Enter the ${f.label.toLowerCase()}`;
    if (s === 3) {
      if (!draft.name.trim()) e.name = "Enter your name";
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(draft.email)) e.email = "Enter a valid email address";
      if (draft.phone && !/^\+?[0-9 ()-]{10,20}$/.test(draft.phone)) e.phone = "Enter a US phone number";
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const next = () => {
    if (!validate(step)) return;
    track("quote_step", { step: step + 1, category: draft.category, source });
    setDirection(1);
    setStep((s) => Math.min(s + 1, steps.length - 1));
  };

  const submit = async () => {
    if (!validate(3)) return;
    const res = await executeAsync({ ...draft, date: draft.date || undefined, notes: draft.notes || undefined, phone: draft.phone || undefined, source, turnstileToken: captcha ?? undefined });
    if (res?.data?.id) {
      track("quote_submitted", { category: draft.category, source, lead_id: res.data.id });
      try {
        sessionStorage.removeItem(STORAGE_KEY);
      } catch {}
      router.push(`/quote/thanks?email=${encodeURIComponent(draft.email)}&category=${draft.category}`);
    }
  };

  return (
    <div className="grid gap-10 large:grid-cols-[minmax(0,1fr)_340px] large:gap-16">
      <div className="min-w-0">
        <ol className="mb-8 grid grid-cols-4 gap-2" aria-label="Progress">
          {steps.map((label, i) => (
            <li key={label} className="flex flex-col gap-2">
              <span className="relative h-1 overflow-hidden rounded-full bg-surface-container-highest">
                <span
                  className={cn(
                    "absolute inset-0 origin-left rounded-full bg-primary transition-transform duration-(--duration-long2) ease-(--ease-emphasized)",
                    i <= step ? "scale-x-100" : "scale-x-0",
                    i <= step && direction === 1 && "delay-(--duration-short2)",
                  )}
                />
              </span>
              <span className={cn("hidden text-label-md transition-colors duration-(--duration-medium2) medium:block", i === step ? "text-on-surface" : "text-on-surface-variant")} aria-current={i === step ? "step" : undefined}>
                {i + 1}. {label}
              </span>
            </li>
          ))}
        </ol>

        <StepTransition stepKey={step} direction={direction}>
          <h1 ref={headingRef} tabIndex={-1} className="text-headline-lg font-normal outline-none medium:text-display-sm">
            {step === 0 && "What are you shipping?"}
            {step === 1 && "Where is it going, and when?"}
            {step === 2 && `A few details about your ${category?.shortName.toLowerCase() ?? "shipment"}`}
            {step === 3 && "Where should we send your options?"}
          </h1>
          <p className="mt-3 text-body-lg text-on-surface-variant">
            {step === 0 && "Pick the closest match. Each type asks only what carriers need to price it."}
            {step === 1 && "A city or ZIP code is enough for now. You'll confirm exact addresses after booking."}
            {step === 2 && "Carriers use these to decide if they can take the load and what to bid."}
            {step === 3 && "We'll email a summary and a link to publish your load to verified carriers. No payment now."}
          </p>

          <div className="mt-8">
            {step === 0 && (
              <fieldset>
                <legend className="sr-only">Shipment type</legend>
                <div className="flex flex-col gap-8">
                  {groups.map((g) => (
                    <div key={g}>
                      <p className="mb-3 text-title-sm text-on-surface-variant">{categoryGroups[g].label}</p>
                      <div className="flex flex-wrap gap-2">
                        {categories
                          .filter((c) => c.group === g)
                          .map((c) => {
                            const selected = draft.category === c.slug;
                            return (
                              <label
                                key={c.slug}
                                className={cn(
                                  "state-layer inline-flex h-10 cursor-pointer items-center gap-2 rounded-sm border px-4 text-label-lg font-medium transition-[color,background-color,border-color] duration-(--duration-medium2) ease-standard has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-primary",
                                  selected ? "border-transparent bg-secondary-container text-on-secondary-container" : "border-outline text-on-surface-variant",
                                )}
                              >
                                <input
                                  type="radio"
                                  name="category"
                                  value={c.slug}
                                  checked={selected}
                                  onChange={() => {
                                    set("category", c.slug);
                                    setErrors({});
                                  }}
                                  className="sr-only"
                                />
                                {selected && (
                                  <span className="inline-flex w-[18px] animate-grow-in overflow-hidden">
                                    <Icon icon={checkIcon} size={18} className="shrink-0" />
                                  </span>
                                )}
                                {c.name}
                              </label>
                            );
                          })}
                      </div>
                    </div>
                  ))}
                </div>
                {errors.category && (
                  <p className="mt-4 animate-message-in text-body-md text-error" role="alert">
                    {errors.category}
                  </p>
                )}
              </fieldset>
            )}

            {step === 1 && (
              <div className="flex flex-col gap-4">
                <div className="grid gap-4 medium:grid-cols-2">
                  <TextField label="Pickup city or ZIP" value={draft.from} onChange={(e) => set("from", e.target.value)} error={errors.from} autoComplete="address-level2" />
                  <TextField label="Delivery city or ZIP" value={draft.to} onChange={(e) => set("to", e.target.value)} error={errors.to} />
                </div>
                <div className="grid gap-4 medium:grid-cols-2">
                  <TextField label="Preferred pickup date" type="date" value={draft.date} onChange={(e) => set("date", e.target.value)} supportingText="Leave empty if you don't have a date yet" />
                </div>
                <Checkbox checked={draft.flexible} onCheckedChange={(v) => set("flexible", v === true)} label="My dates are flexible by a few days" />
              </div>
            )}

            {step === 2 && (
              <div className="flex flex-col gap-4">
                <div className="grid gap-4 medium:grid-cols-2">
                  {fields.map((f) =>
                    f.kind === "select" ? (
                      <SelectField key={f.name} field={f} value={draft.details[f.name] ?? ""} onChange={(v) => setDetail(f.name, v)} error={errors[f.name]} />
                    ) : (
                      <TextField
                        key={f.name}
                        label={f.suffix ? `${f.label} (${f.suffix})` : f.label}
                        type={f.kind}
                        inputMode={f.kind === "number" ? "numeric" : undefined}
                        min={f.kind === "number" ? f.min : undefined}
                        max={f.kind === "number" ? f.max : undefined}
                        placeholder={f.placeholder}
                        required={f.required}
                        value={draft.details[f.name] ?? ""}
                        onChange={(e) => setDetail(f.name, e.target.value)}
                        error={errors[f.name]}
                      />
                    ),
                  )}
                </div>
                <label className="flex flex-col gap-1">
                  <span className="text-body-sm text-on-surface-variant">Anything else carriers should know (optional)</span>
                  <textarea
                    value={draft.notes}
                    onChange={(e) => set("notes", e.target.value)}
                    rows={4}
                    maxLength={2000}
                    placeholder="Narrow street, gate code needed, piano on the second floor…"
                    className="rounded-xs border border-outline bg-transparent px-4 py-3 text-body-lg text-on-surface outline-none transition-[border-color,box-shadow] duration-(--duration-short4) ease-standard hover:border-on-surface focus:border-primary focus:shadow-[inset_0_0_0_1px_var(--md-primary)]"
                  />
                </label>
              </div>
            )}

            {step === 3 && (
              <div className="flex flex-col gap-4">
                <TextField label="Full name" value={draft.name} onChange={(e) => set("name", e.target.value)} error={errors.name} autoComplete="name" />
                <div className="grid gap-4 medium:grid-cols-2">
                  <TextField label="Email" type="email" value={draft.email} onChange={(e) => set("email", e.target.value)} error={errors.email} autoComplete="email" />
                  <TextField label="Phone (optional)" type="tel" value={draft.phone} onChange={(e) => set("phone", e.target.value)} error={errors.phone} autoComplete="tel" />
                </div>
                <Checkbox checked={draft.marketingOptIn} onCheckedChange={(v) => set("marketingOptIn", v === true)} label="Send me shipping guides and tips, about twice a month" />
                <Turnstile onToken={onToken} />
                <p className="text-body-sm text-on-surface-variant">
                  By continuing you agree to our{" "}
                  <Link href="/terms-and-conditions" className="text-primary hover:underline">
                    Terms
                  </Link>{" "}
                  and{" "}
                  <Link href="/privacy-policy" className="text-primary hover:underline">
                    Privacy Policy
                  </Link>
                  .
                </p>
                {result.serverError && (
                  <p className="animate-message-in rounded-md bg-error-container px-4 py-3 text-body-md text-on-error-container" role="alert">
                    {result.serverError}
                  </p>
                )}
              </div>
            )}
          </div>
        </StepTransition>

        <div className="mt-10 flex flex-wrap items-center justify-between gap-3 border-t border-outline-variant pt-6">
          {step > 0 ? (
            <Button
              variant="text"
              leading={<Icon icon={arrowBackIcon} size={18} />}
              onClick={() => {
                setDirection(-1);
                setStep((s) => s - 1);
              }}
            >
              Back
            </Button>
          ) : (
            <span />
          )}
          {step < steps.length - 1 ? (
            <Button size="lg" trailing={<Icon icon={arrowForwardIcon} size={20} />} onClick={next}>
              Continue
            </Button>
          ) : (
            <Button size="lg" loading={isPending} onClick={submit}>
              Send my request
            </Button>
          )}
        </div>
      </div>

      <aside className="flex flex-col gap-6 large:sticky large:top-24 large:self-start">
        <div className="rounded-xl bg-surface-container-low p-6">
          <p className="text-title-md">Your request</p>
          <dl className="mt-4 flex flex-col gap-3 text-body-md">
            <Summary label="Shipping" value={category?.name} />
            <Summary label="From" value={draft.from} />
            <Summary label="To" value={draft.to} />
            <Summary label="Pickup" value={draft.date ? new Date(`${draft.date}T12:00:00`).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : draft.from ? "Flexible" : undefined} />
          </dl>
        </div>
        <ul className="flex flex-col gap-3 px-2 text-body-md text-on-surface-variant">
          <li className="flex gap-3">
            <Icon icon={lockIcon} size={20} className="shrink-0 text-primary" />
            Nothing to pay now. You pay only after you accept a bid, and the money waits in escrow until delivery.
          </li>
          <li className="flex gap-3">
            <Icon icon={checkIcon} size={20} className="shrink-0 text-primary" />
            Only carriers with verified USDOT and MC numbers can bid.
          </li>
          <li className="flex gap-3">
            <Icon icon={checkIcon} size={20} className="shrink-0 text-primary" />
            Prefer to talk?{" "}
            <a href={site.phone.href} className="font-medium text-primary hover:underline" data-track="click_to_call">
              {site.phone.display}
            </a>
          </li>
        </ul>
      </aside>
    </div>
  );
}

function Summary({ label, value }: { label: string; value?: string }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-on-surface-variant">{label}</dt>
      <dd className={cn("text-right transition-colors duration-(--duration-medium2)", value ? "text-on-surface" : "text-on-surface-variant/60")}>{value || "—"}</dd>
    </div>
  );
}

function SelectField({ field, value, onChange, error }: { field: Extract<QuoteField, { kind: "select" }>; value: string; onChange: (v: string) => void; error?: string }) {
  const id = `q-${field.name}`;
  return (
    <div className="flex flex-col gap-1">
      <div
        className={cn(
          "relative flex h-14 items-center rounded-xs border transition-[border-color,box-shadow] duration-(--duration-short4) ease-standard",
          error ? "border-error focus-within:shadow-[inset_0_0_0_1px_var(--md-error)]" : "border-outline hover:border-on-surface focus-within:border-primary focus-within:shadow-[inset_0_0_0_1px_var(--md-primary)]",
        )}
      >
        <label htmlFor={id} className="pointer-events-none absolute -top-2 left-3 bg-surface px-1 text-body-sm text-on-surface-variant">
          {field.label}
          {field.required && <span aria-hidden="true"> *</span>}
        </label>
        <select id={id} value={value} onChange={(e) => onChange(e.target.value)} aria-invalid={error ? true : undefined} className="h-full w-full appearance-none bg-transparent px-4 pr-10 text-body-lg text-on-surface outline-none">
          <option value="">Select</option>
          {field.options.map((o) => (
            <option key={o} value={o}>
              {o}
            </option>
          ))}
        </select>
        <Icon icon={keyboardArrowDownIcon} size={20} className="pointer-events-none absolute right-3 text-on-surface-variant" />
      </div>
      {error && (
        <p key={error} className="animate-message-in px-4 text-body-sm text-error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
