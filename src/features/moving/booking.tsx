"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useAction } from "next-safe-action/hooks";
import { useCallback, useEffect, useId, useState, type ReactNode } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import type { z } from "zod";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { SegmentedButton } from "@/components/ui/segmented-button";
import { SelectField } from "@/components/ui/select-field";
import { TextField } from "@/components/ui/text-field";
import { Turnstile } from "@/features/auth/turnstile";
import { GoogleButton } from "@/features/auth/google-button";
import { AreaField } from "@/features/location/area-field";
import { cn } from "@/lib/cn";
import { formatUsd } from "@/lib/money";
import { bookInstantQuoteAction, findMatchesAction, requestMoveBidsAction, stashMoveForGoogleAction } from "@/server/actions/matcher";
import { authClient } from "@/server/auth/client";
import { MOVING_CLAIM_PATH } from "@/server/matcher/claim";
import type { Match, MatchRoute } from "@/server/matcher/service";
import { Breakdown, MatchList } from "./match-list";
import { bedroomVolumes } from "./pricing";
import { contactSchema, moveRequestSchema, moveTypes, type MoveRequestData, type MoveRequestInput } from "./schema";

export type BookingIcons = {
  search: ReactNode;
  from: ReactNode;
  to: ReactNode;
  swap: ReactNode;
  star: ReactNode;
  verified: ReactNode;
  check: ReactNode;
  info: ReactNode;
  mail: ReactNode;
};

type Results = { route: MatchRoute; volumeCuFt: number; matches: Match[]; requirements: string[]; request: MoveRequestData };
type Step = "route" | "home" | "results" | "contact";
type ContactInput = z.input<typeof contactSchema>;
type ContactData = z.output<typeof contactSchema>;

const STORAGE_KEY = "allship:moving-search";
const steps: { key: Step; label: string }[] = [
  { key: "route", label: "Route" },
  { key: "home", label: "Your home" },
  { key: "results", label: "Prices" },
  { key: "contact", label: "Contact" },
];

const today = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

const defaults: MoveRequestInput = {
  moveType: "house",
  from: "",
  to: "",
  bedrooms: 2,
  pickupDate: "",
  deliveryDate: "",
  packing: "none",
  unpacking: false,
  storage: false,
  storageMonths: 0,
  climateControlled: false,
  insurance: false,
  longTerm: false,
};

const packingOptions = [
  { value: "none" as const, label: "None" },
  { value: "quarter" as const, label: "25%" },
  { value: "half" as const, label: "50%" },
  { value: "full" as const, label: "100%" },
];

const shortDate = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", timeZone: "UTC" });

function readSaved(): MoveRequestInput | null {
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<MoveRequestInput>;
    return { ...defaults, ...parsed, turnstileToken: undefined };
  } catch {
    return null;
  }
}

export function MovingBooking({ icons, feePercent, googleEnabled = false }: { icons: BookingIcons; feePercent: number; googleEnabled?: boolean }) {
  const form = useForm<MoveRequestInput, unknown, MoveRequestData>({ resolver: zodResolver(moveRequestSchema), defaultValues: defaults, mode: "onTouched" });
  const { register, control, handleSubmit, setValue, setError, getValues, formState, reset, trigger } = form;
  const errors = formState.errors;
  const contact = useForm<ContactInput, unknown, ContactData>({ resolver: zodResolver(contactSchema), defaultValues: { name: "", email: "", phone: "" } });
  const search = useAction(findMatchesAction);
  const book = useAction(bookInstantQuoteAction);
  const bids = useAction(requestMoveBidsAction);
  const stash = useAction(stashMoveForGoogleAction);
  const sessionState = authClient.useSession();
  const me = sessionState.data?.user as { name: string; email: string; phone?: string | null; accountType?: string | null } | undefined;
  const [banner, setBanner] = useState<string | null>(null);
  const [step, setStep] = useState<Step>("route");
  const [results, setResults] = useState<Results | null>(null);
  const [chosen, setChosen] = useState<Match | null>(null);
  const [captcha, setCaptcha] = useState<string | null>(null);
  const [captchaReset, setCaptchaReset] = useState(0);
  const [minDate, setMinDate] = useState<string | undefined>(undefined);
  const [more, setMore] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [signIn, setSignIn] = useState<string | null>(null);
  const [leaving, setLeaving] = useState(false);
  const [optIn, setOptIn] = useState(false);
  const moreId = useId();
  const cardId = useId();
  const storage = useWatch({ control, name: "storage" });
  const pickupDate = useWatch({ control, name: "pickupDate" });
  const all = useWatch({ control });
  const stepIndex = steps.findIndex((s) => s.key === step);
  const extrasCount = [all.packing && all.packing !== "none", all.unpacking, all.storage, all.insurance, all.climateControlled, all.longTerm, Boolean(all.deliveryDate), all.moveType && all.moveType !== "house"].filter(Boolean).length;
  const showMore = more || Boolean(errors.deliveryDate || errors.storageMonths || errors.moveType);

  useEffect(() => {
    const saved = readSaved();
    const params = new URLSearchParams(window.location.search);
    const from = params.get("from")?.trim().slice(0, 120);
    const to = params.get("to")?.trim().slice(0, 120);
    const id = window.setTimeout(() => {
      setMinDate(today());
      if (saved) reset(saved);
      if (from) setValue("from", from, { shouldDirty: true });
      if (to) setValue("to", to, { shouldDirty: true });
      const reason = params.get("notice");
      if (reason === "carrier-account") setBanner("That Google account is a carrier account. Book with a customer account or your email.");
      if (reason === "claim-failed") setBanner("We couldn't finish that booking. Search again and we'll get it done.");
    }, 0);
    return () => window.clearTimeout(id);
  }, [reset, setValue]);

  useEffect(() => {
    try {
      window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ ...all, turnstileToken: undefined }));
    } catch {}
  }, [all]);

  const onToken = useCallback((t: string | null) => setCaptcha(t), []);

  const go = (next: Step) => {
    setStep(next);
    setCaptcha(null);
    setNotice(null);
    window.setTimeout(() => {
      const card = document.getElementById(cardId);
      if (!card) return;
      if (card.getBoundingClientRect().top < 64) card.scrollIntoView({ behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "start" });
      card.querySelector<HTMLElement>("[data-step-focus]")?.focus({ preventScroll: true });
    }, 30);
  };

  const toHome = async () => {
    if (await trigger(["from", "to"], { shouldFocus: true })) go("home");
  };

  const onSearch = handleSubmit(async (values) => {
    const res = await search.executeAsync({ ...values, turnstileToken: captcha ?? undefined });
    setCaptchaReset((n) => n + 1);
    const data = res?.data;
    if (!data) return;
    if (!data.ok) {
      go("route");
      window.setTimeout(() => setError(data.field, { message: data.message }, { shouldFocus: true }), 40);
      return;
    }
    setResults({ route: data.route, volumeCuFt: data.volumeCuFt, matches: data.matches, requirements: data.requirements, request: values });
    setChosen(null);
    go("results");
  });

  useEffect(() => {
    if (step !== "contact" || !me || me.accountType === "carrier") return;
    contact.reset({ name: me.name || me.email, email: me.email, phone: me.phone ?? contact.getValues("phone") });
  }, [step, me, contact]);

  const onContact = contact.handleSubmit(async (person) => {
    if (!results) return;
    setNotice(null);
    const res = chosen
      ? await book.executeAsync({ request: results.request, carrierOrgId: chosen.carrierOrgId, quotedCarrierCents: chosen.carrierCents, contact: person, marketingOptIn: optIn, turnstileToken: captcha ?? undefined })
      : await bids.executeAsync({ request: results.request, contact: person, marketingOptIn: optIn, turnstileToken: captcha ?? undefined });
    setCaptchaReset((n) => n + 1);
    const data = res?.data;
    if (!data) return;
    if (data.status === "price_changed") {
      const updated = { ...chosen!, carrierCents: data.carrierCents, platformFeeCents: data.shipperTotalCents - data.carrierCents, shipperTotalCents: data.shipperTotalCents };
      setChosen(updated);
      setResults((r) => (r ? { ...r, matches: r.matches.map((m) => (m.carrierOrgId === updated.carrierOrgId ? updated : m)) } : r));
      setNotice(`${updated.name} updated their rates a moment ago. The new total is ${formatUsd(updated.shipperTotalCents)}. Check it and confirm again.`);
      return;
    }
    if (data.status === "sign_in") {
      setSignIn(data.href);
      return;
    }
    try {
      window.sessionStorage.removeItem(STORAGE_KEY);
    } catch {}
    setLeaving(true);
    window.location.assign(data.href);
  });

  const swap = () => {
    const { from, to } = getValues();
    setValue("from", to, { shouldDirty: true });
    setValue("to", from, { shouldDirty: true });
  };

  const submitting = book.isPending || bids.isPending || leaving;
  const contactError = book.result.serverError ?? bids.result.serverError ?? stash.result.serverError ?? "";
  const ce = contact.formState.errors;
  const bedrooms = Number(all.bedrooms ?? 2);

  return (
    <div id={cardId} className="scroll-mt-20 rounded-xl bg-surface-container-lowest p-5 text-on-surface shadow-elevation-2 [--field-bg:var(--md-surface-container-lowest)] medium:p-8">
      <div className="mb-6 flex items-center gap-4">
        {stepIndex > 0 && !signIn ? (
          <button type="button" onClick={() => go(steps[stepIndex - 1]!.key)} aria-label="Back" className="state-layer -ml-2 inline-flex size-10 shrink-0 cursor-pointer items-center justify-center rounded-full text-on-surface-variant">
            <svg aria-hidden="true" viewBox="0 0 24 24" className="size-6 fill-current">
              <path d="m10.8 12 4.6 4.6L14 18l-6-6 6-6 1.4 1.4z" />
            </svg>
          </button>
        ) : null}
        <div className="min-w-0 flex-1">
          <p className="text-label-lg text-on-surface-variant">
            Step {stepIndex + 1} of {steps.length} · <span className="text-on-surface">{steps[stepIndex]!.label}</span>
          </p>
          <div className="mt-2 grid grid-cols-4 gap-1.5" aria-hidden="true">
            {steps.map((s, i) => (
              <span key={s.key} className={cn("h-1 rounded-full transition-colors duration-(--duration-medium2)", i <= stepIndex ? "bg-primary" : "bg-surface-container-highest")} />
            ))}
          </div>
        </div>
      </div>

      {banner && <p className="mb-6 rounded-md bg-warning-container p-3 text-body-md text-on-warning-container">{banner}</p>}

      {step === "route" && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void toHome();
          }}
          noValidate
          aria-label="Where are you moving"
          className="flex flex-col gap-6"
        >
          <h2 data-step-focus tabIndex={-1} className="text-headline-sm text-on-surface outline-none">
            Where are you moving?
          </h2>
          <div className="grid gap-4 medium:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] medium:items-start">
            <Controller
              control={control}
              name="from"
              render={({ field }) => (
                <AreaField label="Moving from" placeholder="ZIP or city, state" leading={icons.from} value={field.value} onValueChange={field.onChange} onBlur={field.onBlur} ref={field.ref} name={field.name} error={errors.from?.message} required supportingText="Start typing a ZIP code or city" />
              )}
            />
            <button type="button" onClick={swap} aria-label="Swap from and to" className="state-layer hidden size-14 cursor-pointer items-center justify-center rounded-full text-on-surface-variant medium:inline-flex">
              {icons.swap}
            </button>
            <Controller
              control={control}
              name="to"
              render={({ field }) => (
                <AreaField label="Moving to" placeholder="ZIP or city, state" leading={icons.to} value={field.value} onValueChange={field.onChange} onBlur={field.onBlur} ref={field.ref} name={field.name} error={errors.to?.message} required supportingText="Start typing a ZIP code or city" />
              )}
            />
          </div>
          <Button type="submit" size="lg" className="h-14 w-full">
            Continue
          </Button>
          <ul className="flex flex-wrap gap-x-6 gap-y-2 text-body-md text-on-surface-variant" aria-label="What you get">
            {["Free, no sign-up to see prices", "FMCSA status on every mover", "Paid from escrow after delivery"].map((t) => (
              <li key={t} className="inline-flex items-center gap-2">
                <span className="text-primary">{icons.check}</span>
                {t}
              </li>
            ))}
          </ul>
        </form>
      )}

      {step === "home" && (
        <form onSubmit={onSearch} noValidate aria-label="Your home and moving date" className="flex flex-col gap-6">
          <h2 data-step-focus tabIndex={-1} className="text-headline-sm text-on-surface outline-none">
            How big is your home?
          </h2>
          <Controller
            control={control}
            name="bedrooms"
            render={({ field }) => (
              <div role="radiogroup" aria-label="Bedrooms" className="grid grid-cols-2 gap-2 medium:grid-cols-4">
                {bedroomVolumes.map((v, i) => {
                  const n = i + 1;
                  const on = Number(field.value) === n;
                  return (
                    <button
                      key={n}
                      type="button"
                      role="radio"
                      aria-checked={on}
                      onClick={() => field.onChange(n)}
                      className={cn(
                        "state-layer flex cursor-pointer flex-col items-start rounded-md border px-4 py-3 text-left transition-colors",
                        on ? "border-primary bg-primary-container text-on-primary-container" : "border-outline-variant text-on-surface",
                      )}
                    >
                      <span className="text-title-md">{n === 1 ? "1 bedroom" : `${n} bedrooms`}</span>
                      <span className={cn("text-body-sm", on ? "text-on-primary-container" : "text-on-surface-variant")}>about {v.toLocaleString("en-US")} ft³</span>
                    </button>
                  );
                })}
              </div>
            )}
          />
          <TextField label="Moving date" type="date" min={minDate} error={errors.pickupDate?.message} required className="medium:max-w-[320px]" {...register("pickupDate")} />

          <div className="flex flex-col gap-5">
            <button type="button" onClick={() => setMore((v) => !v)} aria-expanded={showMore} aria-controls={moreId} className="inline-flex w-fit cursor-pointer items-center gap-2 text-label-lg font-medium text-primary">
              <span aria-hidden="true" className="text-title-md leading-none">
                {showMore ? "−" : "+"}
              </span>
              Packing, storage and more
              <span className="font-normal text-on-surface-variant">{extrasCount > 0 ? `· ${extrasCount} added` : "· optional"}</span>
            </button>
            <div id={moreId} hidden={!showMore} className="flex flex-col gap-6 border-t border-outline-variant pt-5">
              <div className="grid gap-4 medium:grid-cols-2">
                <SelectField label="Type of home" options={moveTypes.map((m) => ({ value: m.value, label: m.label }))} error={errors.moveType?.message} {...register("moveType")} />
                <TextField label="Delivery date" type="date" min={pickupDate || minDate} error={errors.deliveryDate?.message} supportingText="Optional" {...register("deliveryDate")} />
              </div>
              <fieldset className="flex flex-col gap-3">
                <legend className="mb-3 text-title-sm text-on-surface">How much should the crew pack?</legend>
                <Controller control={control} name="packing" render={({ field }) => <SegmentedButton label="Packing" value={field.value ?? "none"} onChange={field.onChange} options={packingOptions} />} />
              </fieldset>
              <fieldset className="grid gap-x-6 gap-y-3 medium:grid-cols-2 large:grid-cols-3">
                <legend className="mb-3 text-title-sm text-on-surface">Extra services</legend>
                <Controller control={control} name="unpacking" render={({ field }) => <Checkbox label="Unpacking at the new home" checked={field.value} onCheckedChange={(v) => field.onChange(v === true)} />} />
                <Controller control={control} name="storage" render={({ field }) => <Checkbox label="Storage, priced by the month" checked={field.value} onCheckedChange={(v) => field.onChange(v === true)} />} />
                <Controller control={control} name="insurance" render={({ field }) => <Checkbox label="Full value protection (insurance)" checked={field.value} onCheckedChange={(v) => field.onChange(v === true)} />} />
                <Controller control={control} name="climateControlled" render={({ field }) => <Checkbox label="Climate-controlled" checked={field.value} onCheckedChange={(v) => field.onChange(v === true)} />} />
                <Controller control={control} name="longTerm" render={({ field }) => <Checkbox label="Long-term storage" checked={field.value} onCheckedChange={(v) => field.onChange(v === true)} />} />
              </fieldset>
              {storage && (
                <TextField label="Storage, months" type="number" inputMode="numeric" min={1} max={24} className="medium:max-w-[240px]" supportingText="How many months do you need storage for?" error={errors.storageMonths?.message} {...register("storageMonths")} />
              )}
            </div>
          </div>

          <Turnstile onToken={onToken} resetKey={captchaReset} />
          <Button type="submit" size="lg" loading={search.isPending} leading={icons.search} className="h-14 w-full">
            See prices
          </Button>
          <p aria-live="polite" className="text-body-md text-error empty:hidden">
            {search.result.serverError ?? ""}
          </p>
        </form>
      )}

      {(step === "results" || step === "contact") && results && (
        <p className="mb-6 flex flex-wrap items-center gap-x-3 gap-y-1 rounded-md bg-surface-container-low px-4 py-3 text-body-md text-on-surface-variant">
          <span className="text-on-surface">
            {results.route.from} <span aria-hidden="true">→</span>
            <span className="sr-only">to</span> {results.route.to}
          </span>
          <span>
            {Math.round(results.route.miles).toLocaleString("en-US")} mi · {bedrooms} {bedrooms === 1 ? "bedroom" : "bedrooms"} · {shortDate.format(new Date(`${results.request.pickupDate}T00:00:00Z`))}
          </span>
          <button type="button" onClick={() => go("route")} className="ml-auto cursor-pointer text-label-lg font-medium text-primary">
            Edit
          </button>
        </p>
      )}

      {step === "results" && results && (
        <div data-step-focus tabIndex={-1} className="outline-none">
          <MatchList
            results={results}
            icons={icons}
            feePercent={feePercent}
            onChoose={(m) => {
              setChosen(m);
              go("contact");
            }}
            onRequestBids={() => {
              setChosen(null);
              go("contact");
            }}
          />
        </div>
      )}

      {step === "contact" && results && !signIn && (
        <form onSubmit={onContact} noValidate aria-label="Your contact details" className="flex flex-col gap-6">
          <div>
            <h2 data-step-focus tabIndex={-1} className="text-headline-sm text-on-surface outline-none">
              {chosen ? `Book ${chosen.name}` : "Where should movers send prices?"}
            </h2>
            <p className="mt-2 text-body-lg text-pretty text-on-surface-variant">
              {chosen ? "We send the booking request to the mover now. They call to confirm the details before pickup." : "We post your move right away and verified movers send their bids to your AllShip account."}
            </p>
          </div>
          {notice && <p className="rounded-md bg-warning-container p-3 text-body-md text-on-warning-container">{notice}</p>}
          {chosen && (
            <details className="rounded-md bg-surface-container-low p-4">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 [&::-webkit-details-marker]:hidden">
                <span className="text-title-sm text-on-surface">Total if you accept</span>
                <span className="text-title-lg text-on-surface tabular-nums">{formatUsd(chosen.shipperTotalCents)}</span>
              </summary>
              <div className="mt-4">
                <Breakdown match={chosen} feePercent={feePercent} />
              </div>
            </details>
          )}
          {me && me.accountType === "carrier" ? (
            <div className="flex flex-col gap-4 rounded-md bg-surface-container-low p-4">
              <p className="text-body-lg text-pretty text-on-surface">You&rsquo;re signed in as {me.email}, a carrier account. Moves are booked from a customer account.</p>
              <Button
                type="button"
                variant="tonal"
                className="w-fit"
                onClick={async () => {
                  await authClient.signOut();
                  contact.reset({ name: "", email: "", phone: "" });
                }}
              >
                Sign out and continue
              </Button>
            </div>
          ) : me ? (
            <>
              <div className="flex items-center gap-4 rounded-md bg-surface-container-low p-4">
                <span aria-hidden="true" className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary text-title-sm text-on-primary">
                  {(me.name || me.email).slice(0, 1).toUpperCase()}
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-title-sm text-on-surface">{me.name || me.email}</span>
                  <span className="block truncate text-body-md text-on-surface-variant">Booking with your account · {me.email}</span>
                </span>
              </div>
              {!me.phone && <TextField label="Phone" type="tel" autoComplete="tel" inputMode="tel" error={ce.phone?.message} supportingText="The mover calls to confirm details" required {...contact.register("phone")} />}
              <Turnstile onToken={onToken} resetKey={captchaReset} />
              <Button type="submit" size="lg" loading={submitting} className="h-14 w-full">
                {chosen ? `Book for ${formatUsd(chosen.shipperTotalCents)}` : "Post my move"}
              </Button>
            </>
          ) : (
            <>
{googleEnabled && (
                <>
              <GoogleButton
                callbackURL={MOVING_CLAIM_PATH}
                newUserCallbackURL={MOVING_CLAIM_PATH}
                errorCallbackURL="/moving"
                disabled={submitting}
                onBeforeRedirect={async () => {
                  const phone = contact.getValues("phone").trim();
                  const res = await stash.executeAsync({ request: results.request, carrierOrgId: chosen?.carrierOrgId, phone: /^\+?[0-9 ()-]{10,20}$/.test(phone) ? phone : "" });
                  return Boolean(res?.data?.ok);
                }}
              />
              <div className="flex items-center gap-4 text-body-md text-on-surface-variant" aria-hidden="true">
                <span className="h-px flex-1 bg-outline-variant" />
                or with your email
                <span className="h-px flex-1 bg-outline-variant" />
              </div>
                </>
              )}
              <div className="grid gap-4">
                <TextField label="Full name" autoComplete="name" error={ce.name?.message} required {...contact.register("name")} />
                <div className="grid gap-4 medium:grid-cols-2">
                  <TextField label="Email" type="email" autoComplete="email" inputMode="email" error={ce.email?.message} required {...contact.register("email")} />
                  <TextField label="Phone" type="tel" autoComplete="tel" inputMode="tel" error={ce.phone?.message} supportingText="The mover calls to confirm details" required {...contact.register("phone")} />
                </div>
              </div>
              <Checkbox label="Send me moving tips and AllShip news. Unsubscribe anytime." checked={optIn} onCheckedChange={(v) => setOptIn(v === true)} />
              <Turnstile onToken={onToken} resetKey={captchaReset} />
              <Button type="submit" size="lg" loading={submitting} className="h-14 w-full">
                {chosen ? `Book for ${formatUsd(chosen.shipperTotalCents)}` : "Get my prices"}
              </Button>
              <p className="text-body-sm text-pretty text-on-surface-variant">
                This creates your free AllShip account. Nothing is charged until you accept a price, and your payment stays in escrow until delivery.
              </p>
            </>
          )}
          <p aria-live="polite" className="text-body-md text-error empty:hidden">
            {contactError}
          </p>
        </form>
      )}

      {step === "contact" && signIn && (
        <div className="flex flex-col gap-5">
          <h2 data-step-focus tabIndex={-1} className="text-headline-sm text-on-surface outline-none">
            Welcome back. Sign in to finish
          </h2>
          <p className="text-body-lg text-pretty text-on-surface-variant">You already have an AllShip account with this email. Your move is saved: sign in with your password, Google or a one-time code, and it goes live right away.</p>
          <Button asChild size="lg" className="h-14 w-full">
            <a href={signIn}>Sign in and post my move</a>
          </Button>
        </div>
      )}
    </div>
  );
}
