"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useAction } from "next-safe-action/hooks";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { FormProvider, useForm, useWatch, type Resolver } from "react-hook-form";
import { StepTransition } from "@/components/motion/step-transition";
import { Button } from "@/components/ui/button";
import { Divider } from "@/components/ui/divider";
import { Icon } from "@/components/ui/icon";
import { arrowBackIcon, arrowForwardIcon, historyIcon } from "@/components/ui/icons.generated";
import { Stepper } from "@/components/ui/stepper";
import { categories } from "@/content/categories";
import { DetailsStep } from "@/features/loads/wizard-steps";
import { detailsFor } from "@/features/loads/wizard-model";
import { track } from "@/lib/analytics";
import { savePartialLead, stashPublicLoad, submitPublicLoad } from "@/server/actions/funnel";
import type { LoadCategory } from "@/server/db/schema/enums";
import { TextArea } from "@/components/ui/text-area";
import { TextField } from "@/components/ui/text-field";
import { ContactStep } from "./contact-step";
import { InboxScreen } from "./inbox-screen";
import { LocationStep } from "./location-step";
import { emailSchema, emptyValues, formConfigs, presetFromSearch, stepCopy, stepSchema, summarize, titleFor, type FormKind, type PublicLoadValues, type StopValues } from "./model";
import { TypeStep } from "./type-step";
import { lookupZip, zipStates } from "./zip";

const GoogleButton = dynamic(() => import("@/features/auth/google-button").then((m) => m.GoogleButton), { ssr: false });

const LEAD_VALUE = 1;
const storageKey = (kind: FormKind) => `allship-public-load:${kind}`;
const MAX_AGE = 14 * 86_400_000;

type Saved = { values: PublicLoadValues; step: number; at: number; google?: number };

function readSaved(kind: FormKind): Saved | null {
  try {
    const raw = localStorage.getItem(storageKey(kind));
    if (!raw) return null;
    const saved = JSON.parse(raw) as Saved;
    if (!saved?.values || Date.now() - saved.at > MAX_AGE) return null;
    return saved;
  } catch {
    return null;
  }
}

function writeSaved(kind: FormKind, saved: Saved | null) {
  try {
    if (saved) localStorage.setItem(storageKey(kind), JSON.stringify(saved));
    else localStorage.removeItem(storageKey(kind));
  } catch {}
}

function withoutHoneypot(values: PublicLoadValues) {
  return { ...values, website: "" };
}

const savedDate = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });

export function PublicLoadForm({ kind, googleEnabled }: { kind: FormKind; googleEnabled: boolean }) {
  const config = formConfigs[kind];
  const router = useRouter();
  const steps = config.steps;
  const fixed = config.choices.length === 1 ? config.choices[0]! : "";
  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState<1 | -1>(1);
  const [restoredAt, setRestoredAt] = useState<number | null>(null);
  const [done, setDone] = useState<{ email: string; publicId: string } | null>(null);
  const [captcha, setCaptcha] = useState<string | null>(null);
  const [locked, setLocked] = useState(false);
  const [googleBusy, setGoogleBusy] = useState(false);
  const stepRef = useRef(0);
  const started = useRef(false);
  const partialFor = useRef<string | null>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const topRef = useRef<HTMLDivElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const hydrated = useRef(false);
  const onToken = useCallback((t: string | null) => setCaptcha(t), []);

  const resolver: Resolver<PublicLoadValues> = useCallback(
    (values, ctx, options) => (zodResolver(stepSchema(steps[stepRef.current]!, values.category, config.choices, undefined, zipStates) as never) as unknown as Resolver<PublicLoadValues>)(values, ctx, options),
    [steps, config.choices],
  );
  const form = useForm<PublicLoadValues>({ resolver, defaultValues: emptyValues(fixed), mode: "onTouched", reValidateMode: "onChange", shouldUnregister: false });
  const { executeAsync, isPending, result } = useAction(submitPublicLoad);
  const { executeAsync: savePartial } = useAction(savePartialLead);
  const { executeAsync: stash } = useAction(stashPublicLoad);
  const category = useWatch({ control: form.control, name: "category" });
  const values = useWatch({ control: form.control });
  const key = steps[step]!;

  useEffect(() => {
    if (hydrated.current) return;
    hydrated.current = true;
    const preset = presetFromSearch(window.location.search, config.choices);
    if (preset) {
      const fill = async (place: Partial<StopValues> | null) => {
        if (!place) return {};
        if (place.postalCode && !place.city) {
          const hit = await lookupZip(place.postalCode);
          if (hit) return { ...place, city: hit.city, state: hit.state };
        }
        return place;
      };
      void Promise.all([fill(preset.from), fill(preset.to)]).then(([pickup, dropoff]) => {
        const category = fixed || preset.category;
        const base = emptyValues(category);
        form.reset({ ...base, pickup: { ...base.pickup, ...pickup }, dropoff: { ...base.dropoff, ...dropoff } });
        const target = category ? Math.max(0, steps.indexOf("location")) : 0;
        stepRef.current = target;
        setStep(target);
      });
      return;
    }
    const saved = readSaved(kind);
    if (!saved) return;
    const cancelledGoogle = new URLSearchParams(window.location.search).has("error");
    if (saved.google && !cancelledGoogle) {
      writeSaved(kind, null);
      return;
    }
    const restoredStep = Math.min(Math.max(saved.step, 0), steps.length - 1);
    window.setTimeout(() => {
      form.reset({ ...emptyValues(fixed), ...saved.values, website: "", category: fixed || saved.values.category });
      stepRef.current = restoredStep;
      setStep(restoredStep);
      setRestoredAt(saved.at);
    }, 0);
  }, [form, kind, fixed, steps, config.choices]);

  useEffect(() => {
    if (!hydrated.current || done) return;
    const id = window.setTimeout(() => {
      const rest = withoutHoneypot(form.getValues());
      const pristine = !form.formState.isDirty && stepRef.current === 0;
      if (pristine) return;
      writeSaved(kind, { values: rest, step: stepRef.current, at: Date.now() });
    }, 400);
    return () => window.clearTimeout(id);
  }, [values, step, form, kind, done]);

  useEffect(() => {
    if (key !== "contact") return;
    let cancelled = false;
    fetch("/api/auth/get-session", { credentials: "same-origin", headers: { accept: "application/json" } })
      .then((r) => (r.ok ? r.json() : null))
      .then((data: { user?: { email?: string; firstName?: string | null; lastName?: string | null; name?: string; phone?: string | null } } | null) => {
        const u = data?.user;
        if (cancelled || !u?.email) return;
        const current = form.getValues("contact");
        const [first, ...rest] = (u.name ?? "").split(" ");
        form.setValue("contact.email", u.email);
        if (!current.firstName) form.setValue("contact.firstName", u.firstName || first || "");
        if (!current.lastName) form.setValue("contact.lastName", u.lastName || rest.join(" "));
        if (!current.phone && u.phone) form.setValue("contact.phone", u.phone.replace(/^\+1/, ""));
        setLocked(true);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [key, form]);

  const start = () => {
    if (started.current) return;
    started.current = true;
    track("form_start", { form: kind });
  };

  const go = (next: number) => {
    setDirection(next > stepRef.current ? 1 : -1);
    stepRef.current = next;
    setStep(next);
    window.requestAnimationFrame(() => {
      headingRef.current?.focus({ preventScroll: true });
      const top = (topRef.current?.getBoundingClientRect().top ?? 0) + window.scrollY - 96;
      if (window.scrollY > top) window.scrollTo({ top: Math.max(0, top), behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
    });
  };

  const focusFirstError = () => {
    window.requestAnimationFrame(() => formRef.current?.querySelector<HTMLElement>("[aria-invalid='true']")?.focus());
  };

  const next = async () => {
    start();
    const ok = await form.trigger();
    if (!ok) return focusFirstError();
    form.clearErrors();
    track("form_step", { form: kind, step: stepRef.current + 1, step_name: steps[stepRef.current]!, category: form.getValues("category") });
    go(stepRef.current + 1);
  };

  const back = () => {
    form.clearErrors();
    go(stepRef.current - 1);
  };

  const pick = (c: LoadCategory) => {
    start();
    const current = form.getValues("category");
    if (current !== c) form.setValue("details", detailsFor(c, {}));
    form.setValue("category", c, { shouldDirty: true });
    form.clearErrors("category");
    track("form_step", { form: kind, step: 1, step_name: "type", category: c });
    go(1);
  };

  const payload = () => {
    const v = form.getValues();
    return { category: v.category, pickup: v.pickup, dropoff: v.dropoff, details: v.details, title: v.title, notes: v.notes };
  };

  const onEmailBlur = async () => {
    const c = form.getValues("contact");
    const parsed = emailSchema.safeParse(c.email);
    if (!parsed.success || partialFor.current === parsed.data || locked) return;
    partialFor.current = parsed.data;
    const res = await savePartial({ kind, email: parsed.data, firstName: c.firstName || undefined, lastName: c.lastName || undefined, phone: c.phone || undefined, summary: summarize(form.getValues()) });
    if (res?.data?.ok) track("lead_partial", { form: kind, category: form.getValues("category") });
  };

  const submit = async () => {
    const ok = await form.trigger();
    if (!ok) return focusFirstError();
    const v = form.getValues();
    const res = await executeAsync({ kind, payload: payload(), contact: v.contact, website: v.website || undefined, turnstileToken: captcha ?? undefined });
    const data = res?.data;
    if (!data) return;
    track("generate_lead", { form: kind, category: v.category, value: LEAD_VALUE, currency: "USD", outcome: data.kind, load_id: data.publicId });
    writeSaved(kind, null);
    if (data.kind === "published") {
      router.push(`/app/loads/${data.publicId}?welcome=1`);
      return;
    }
    setDone({ email: data.email, publicId: data.publicId });
  };

  const continueWithGoogle = async () => {
    const v = form.getValues();
    setGoogleBusy(true);
    const res = await stash({ kind, payload: payload(), contact: { firstName: v.contact.firstName || undefined, lastName: v.contact.lastName || undefined, phone: v.contact.phone || undefined }, smsConsent: v.contact.smsConsent });
    if (!res?.data?.ok) {
      setGoogleBusy(false);
      return false;
    }
    track("generate_lead", { form: kind, category: v.category, value: LEAD_VALUE, currency: "USD", outcome: "google" });
    const rest = withoutHoneypot(v);
    writeSaved(kind, { values: rest, step: stepRef.current, at: Date.now(), google: Date.now() });
    return true;
  };

  const startOver = () => {
    writeSaved(kind, null);
    form.reset(emptyValues(fixed));
    setRestoredAt(null);
    partialFor.current = null;
    go(0);
  };

  const suggestion = useMemo(
    () => (values.category ? titleFor({ category: values.category as LoadCategory, details: (values.details ?? {}) as Record<string, unknown>, pickupCity: values.pickup?.city ?? "", dropoffCity: values.dropoff?.city ?? "" }) : ""),
    [values.category, values.details, values.pickup?.city, values.dropoff?.city],
  );

  if (done) {
    return (
      <div ref={topRef}>
        <InboxScreen
          email={done.email}
          publicId={done.publicId || undefined}
          onEditEmail={() => {
            setDone(null);
            partialFor.current = null;
            setStep(steps.length - 1);
          }}
        />
      </div>
    );
  }

  const isLast = step === steps.length - 1;
  const copy = stepCopy[key];
  const err = (path: "title" | "notes") => form.formState.errors[path]?.message;

  return (
    <FormProvider {...form}>
      <form
        ref={formRef}
        noValidate
        onFocusCapture={start}
        onSubmit={(e) => {
          e.preventDefault();
          if (key === "type") return;
          if (isLast) void submit();
          else void next();
        }}
        className="flex min-w-0 flex-col"
      >
        <div ref={topRef} className="scroll-mt-24">
          <Stepper steps={steps.map((s) => ({ label: stepCopy[s].label }))} current={step} onStepClick={(i) => go(i)} label={`${config.heading} steps`} />
        </div>

        {restoredAt && (
          <div role="status" className="mt-6 flex flex-wrap items-center gap-x-3 gap-y-1 rounded-sm bg-surface-container-high px-4 py-3 text-body-md text-on-surface">
            <Icon icon={historyIcon} size={20} className="text-on-surface-variant" />
            <span className="min-w-0 flex-1">We kept what you entered on {savedDate.format(new Date(restoredAt))}.</span>
            <button type="button" onClick={startOver} className="cursor-pointer rounded-xs text-label-lg font-medium text-primary underline-offset-2 hover:underline">
              Start over
            </button>
          </div>
        )}

        <StepTransition stepKey={key} direction={direction} className="mt-8">
          <h2 ref={headingRef} tabIndex={-1} className="text-headline-sm text-on-surface outline-none medium:text-headline-md">
            {key === "details" && category ? (formConfigs[kind].choices.length > 1 ? `${stepCopy.details.title}: ${categories.find((c) => c.key === category)?.name ?? ""}` : stepCopy.details.title) : copy.title}
          </h2>
          <p className="mt-2 mb-8 max-w-[62ch] text-body-lg text-pretty text-on-surface-variant">{copy.lead}</p>

          {key === "type" && <TypeStep choices={config.choices} onPick={pick} />}
          {key === "location" && <LocationStep />}
          {key === "details" && category && (
            <div className="flex flex-col gap-8">
              <DetailsStep category={category as LoadCategory} />
              <section aria-labelledby="more-title" className="flex flex-col gap-5">
                <h3 id="more-title" className="text-title-md text-on-surface">
                  Title and additional details
                </h3>
                <TextField label="Title" maxLength={100} supportingText={suggestion ? `Leave empty to use “${suggestion}”` : "Carriers see this first"} error={err("title")} {...form.register("title")} />
                <TextArea label="Additional details" rows={4} maxLength={2000} showCount supportingText="Anything that affects the price: tight access, special handling, flexible dates. Contact details are shared after booking." error={err("notes")} {...form.register("notes")} />
              </section>
            </div>
          )}
          {key === "contact" && <ContactStep onEmailBlur={() => void onEmailBlur()} onToken={onToken} locked={locked} />}

          {isLast && result.serverError && (
            <p role="alert" className="mt-6 animate-message-in rounded-sm bg-error-container px-4 py-3 text-body-md text-on-error-container">
              {result.serverError}
            </p>
          )}
          {isLast && result.validationErrors && (
            <p role="alert" className="mt-6 animate-message-in rounded-sm bg-error-container px-4 py-3 text-body-md text-on-error-container">
              Some fields need attention. Check each step and try again.
            </p>
          )}
        </StepTransition>

        <div className="sticky bottom-0 z-20 -mx-4 mt-10 flex items-center gap-2 border-t border-outline-variant bg-surface px-4 py-3 medium:static medium:mx-0 medium:px-0 medium:pt-6">
          {step > 0 ? (
            <Button type="button" variant="text" onClick={back} leading={<Icon icon={arrowBackIcon} size={20} />}>
              Back
            </Button>
          ) : (
            <span />
          )}
          <span className="flex-1" />
          {isLast ? (
            <Button type="submit" size="lg" loading={isPending} disabled={isPending || googleBusy}>
              {config.submitLabel}
            </Button>
          ) : key !== "type" ? (
            <Button type="submit" size="lg" trailing={<Icon icon={arrowForwardIcon} size={20} />}>
              Next
            </Button>
          ) : category ? (
            <Button type="button" size="lg" onClick={() => go(1)} trailing={<Icon icon={arrowForwardIcon} size={20} />}>
              Next
            </Button>
          ) : null}
        </div>

        {isLast && googleEnabled && !locked && (
          <div className="mt-6 flex flex-col gap-4">
            <Divider label="or" />
            <GoogleButton callbackURL="/load/claim" newUserCallbackURL="/load/claim" errorCallbackURL={`${config.path}?error=google`} label="Continue with Google and publish" disabled={isPending} onBeforeRedirect={continueWithGoogle} />
            <p className="text-body-sm text-on-surface-variant">Google confirms your email, so your load goes live right away.</p>
          </div>
        )}
      </form>
    </FormProvider>
  );
}
