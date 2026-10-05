"use client";

import { useGSAP } from "@gsap/react";
import { zodResolver } from "@hookform/resolvers/zod";
import gsap from "gsap";
import { useAction } from "next-safe-action/hooks";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { FormProvider, useForm, useWatch, type Resolver } from "react-hook-form";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { IconButton } from "@/components/ui/icon-button";
import { arrowBackIcon, arrowForwardIcon, closeIcon, infoIcon } from "@/components/ui/icons.generated";
import { Stepper } from "@/components/ui/stepper";
import { categories } from "@/content/categories";
import { getMyQuoteLeadAction, saveLoadAction } from "@/server/actions/marketplace";
import type { LoadCategory } from "@/server/db/schema/enums";
import { AiPrefillNote } from "@/features/assistant/prefill-note";
import { clearPrefillParam, onPrefill, takeLoadPrefill } from "@/features/assistant/prefill";
import { formatDay } from "./presentation";
import { CategoryStep, DetailsStep, ReviewStep, RouteStep } from "./wizard-steps";
import { detailsFor, emptyWizard, stepSchema, suggestTitle, toPayload, valuesFromLead, wizardSteps, type QuoteLead, type WizardValues } from "./wizard-model";

gsap.registerPlugin(useGSAP);

type Banner = { leadId: string; summary: string; date: string };

export function LoadWizard({ initial, loadId, initialStep = 0 }: { initial?: WizardValues; loadId?: string; initialStep?: number }) {
  const router = useRouter();
  const [step, setStep] = useState(initialStep);
  const [direction, setDirection] = useState(1);
  const [banner, setBanner] = useState<Banner | null>(null);
  const [aiFilled, setAiFilled] = useState(false);
  const [leadId, setLeadId] = useState<string | undefined>();
  const stepRef = useRef(initialStep);
  const panelRef = useRef<HTMLDivElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const firstRender = useRef(true);
  const lastSuggestion = useRef("");

  const resolver: Resolver<WizardValues> = useCallback(
    (values, ctx, options) => (zodResolver(stepSchema(stepRef.current, values.category) as never) as unknown as Resolver<WizardValues>)(values, ctx, options),
    [],
  );

  const form = useForm<WizardValues>({ resolver, defaultValues: initial ?? emptyWizard(), mode: "onTouched", reValidateMode: "onChange", shouldUnregister: false });
  const { executeAsync: save, isPending } = useAction(saveLoadAction);
  const [publishing, setPublishing] = useState<boolean | null>(null);
  const { executeAsync: fetchLead } = useAction(getMyQuoteLeadAction);

  useEffect(() => {
    if (loadId || initial) return;
    let cancelled = false;
    const applyAi = (values: WizardValues | null) => {
      if (!values) return false;
      cancelled = true;
      form.reset(values);
      setLeadId(undefined);
      setBanner(null);
      setAiFilled(true);
      stepRef.current = values.category ? 1 : 0;
      setStep(stepRef.current);
      clearPrefillParam();
      return true;
    };
    const off = onPrefill("load", () => applyAi(takeLoadPrefill(true)));
    if (applyAi(takeLoadPrefill())) return off;
    fetchLead().then((res) => {
      const lead = res?.data as QuoteLead | null | undefined;
      if (cancelled || !lead) return;
      const values = valuesFromLead(lead);
      if (!values || form.formState.isDirty) return;
      form.reset(values);
      setLeadId(lead.id);
      const cat = categories.find((c) => c.key === values.category);
      const from = [values.pickup.city, values.pickup.state].filter(Boolean).join(", ") || values.pickup.postalCode;
      const to = [values.dropoff.city, values.dropoff.state].filter(Boolean).join(", ") || values.dropoff.postalCode;
      setBanner({ leadId: lead.id, summary: `${cat?.name ?? "Load"}${from && to ? `, ${from} to ${to}` : ""}`, date: formatDay(new Date(lead.createdAt)) });
    });
    return () => {
      cancelled = true;
      off();
    };
  }, [fetchLead, form, initial, loadId]);

  useGSAP(
    () => {
      if (firstRender.current) {
        firstRender.current = false;
        return;
      }
      headingRef.current?.focus({ preventScroll: true });
      const top = (panelRef.current?.getBoundingClientRect().top ?? 0) + window.scrollY - 140;
      if (window.scrollY > top) window.scrollTo({ top: Math.max(0, top), behavior: "smooth" });
      if (!panelRef.current || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
      gsap.fromTo(panelRef.current, { autoAlpha: 0, x: direction * 32 }, { autoAlpha: 1, x: 0, duration: 0.42, ease: "power3.out", clearProps: "transform,opacity,visibility" });
    },
    { dependencies: [step], scope: panelRef },
  );

  const go = useCallback(
    async (next: number) => {
      const animateOut = () =>
        new Promise<void>((resolve) => {
          if (!panelRef.current || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return resolve();
          gsap.to(panelRef.current, { autoAlpha: 0, x: (next > stepRef.current ? -1 : 1) * 24, duration: 0.16, ease: "power2.in", onComplete: () => resolve() });
        });
      if (next === 3) {
        const suggestion = suggestTitle(form.getValues());
        const current = form.getValues("title").trim();
        if (!current || current === lastSuggestion.current) form.setValue("title", suggestion);
        lastSuggestion.current = suggestion;
      }
      setDirection(next > stepRef.current ? 1 : -1);
      await animateOut();
      stepRef.current = next;
      setStep(next);
    },
    [form],
  );

  const next = async () => {
    const ok = await form.trigger();
    if (!ok) {
      const firstError = panelRef.current?.querySelector<HTMLElement>("[aria-invalid='true']");
      firstError?.focus();
      return;
    }
    form.clearErrors();
    await go(step + 1);
  };

  const back = () => {
    form.clearErrors();
    void go(step - 1);
  };

  const pickCategory = async (category: LoadCategory) => {
    const current = form.getValues("category");
    if (current !== category) form.setValue("details", detailsFor(category, current ? {} : form.getValues("details")));
    form.setValue("category", category, { shouldDirty: true });
    form.clearErrors("category");
    await go(1);
  };

  const submit = async (publish: boolean) => {
    const ok = await form.trigger();
    if (!ok) return;
    const values = form.getValues();
    if (!values.title.trim()) form.setValue("title", suggestTitle(values) || "Untitled load");
    setPublishing(publish);
    const result = await save({ loadId, data: toPayload(form.getValues(), publish, leadId) });
    setPublishing(null);
    if (result?.serverError) return void toast.error(result.serverError);
    if (result?.validationErrors) return void toast.error("Some fields need attention. Check each step and try again.");
    const publicId = result?.data?.publicId;
    if (!publicId) return void toast.error("Something went wrong. Try again.");
    toast(publish ? `Posted. ${publicId} is open for bids.` : `Draft saved as ${publicId}.`);
    router.push(`/app/loads/${publicId}`);
    router.refresh();
  };

  const startOver = () => {
    form.reset(emptyWizard());
    setLeadId(undefined);
    setBanner(null);
    void go(0);
  };

  const category = useWatch({ control: form.control, name: "category" });
  const isLast = step === wizardSteps.length - 1;
  const canSaveDraft = step >= 2;

  return (
    <FormProvider {...form}>
      <form
        noValidate
        onSubmit={(e) => {
          e.preventDefault();
          if (isLast) void submit(true);
          else if (step > 0) void next();
        }}
        className="flex flex-col"
      >
        <Stepper
          steps={wizardSteps.map((s) => ({ label: s.short }))}
          current={step}
          onStepClick={(i) => void go(i)}
          label="Load posting steps"
          className="mb-6"
        />

        {banner && (
          <div role="status" className="mb-6 flex items-start gap-3 rounded-md bg-secondary-container py-3 pr-2 pl-4 text-on-secondary-container">
            <Icon icon={infoIcon} className="mt-0.5 shrink-0" />
            <div className="min-w-0 flex-1">
              <p className="text-body-md">
                We filled this in from your quote request on {banner.date}: <span className="font-medium">{banner.summary}</span>. Check each step before you post.
              </p>
              <button type="button" onClick={startOver} className="mt-1 cursor-pointer text-label-lg font-medium underline underline-offset-2">
                Start from scratch
              </button>
            </div>
            <IconButton icon={closeIcon} label="Dismiss" onClick={() => setBanner(null)} className="text-on-secondary-container" />
          </div>
        )}

        {aiFilled && <AiPrefillNote className="mb-6" onDismiss={() => setAiFilled(false)} />}

        <div ref={panelRef} className="min-h-[320px]">
          <h2 ref={headingRef} tabIndex={-1} className="mb-1 text-headline-sm text-on-surface outline-none">
            {wizardSteps[step]?.label}
          </h2>
          <p className="mb-6 text-body-lg text-on-surface-variant">
            {step === 0 && "Pick the closest match. You can change it later."}
            {step === 1 && `The more carriers know, the closer their bids are to the final price.`}
            {step === 2 && "Exact addresses stay private until you book a carrier. Bidders only see the city and ZIP area."}
            {step === 3 && "Check everything once more. Carriers can bid as soon as you post."}
          </p>
          {step === 0 && <CategoryStep onPick={pickCategory} />}
          {step === 1 && category && <DetailsStep category={category} />}
          {step === 2 && <RouteStep />}
          {step === 3 && (
            <ReviewStep
              onEdit={(i) => void go(i)}
              suggestion={suggestTitle(form.getValues())}
              onUseSuggestion={() => form.setValue("title", suggestTitle(form.getValues()), { shouldValidate: true, shouldDirty: true })}
            />
          )}
        </div>

        <div data-tour="wizard-actions" className="sticky bottom-20 z-20 -mx-4 mt-8 flex items-center gap-2 border-t border-outline-variant bg-surface px-4 py-3 medium:bottom-0 medium:mx-0 medium:px-0">
          {step > 0 ? (
            <Button type="button" variant="text" onClick={back} leading={<Icon icon={arrowBackIcon} size={20} />}>
              Back
            </Button>
          ) : (
            <span />
          )}
          <span className="flex-1" />
          {canSaveDraft && (
            <Button type="button" variant={isLast ? "outlined" : "text"} onClick={() => void submit(false)} loading={isPending && publishing === false} disabled={isPending}>
              Save draft
            </Button>
          )}
          {isLast ? (
            <Button type="submit" loading={isPending && publishing === true} disabled={isPending}>
              Post load
            </Button>
          ) : step > 0 ? (
            <Button type="submit" trailing={<Icon icon={arrowForwardIcon} size={20} />}>
              Continue
            </Button>
          ) : category ? (
            <Button type="button" onClick={() => void go(1)} trailing={<Icon icon={arrowForwardIcon} size={20} />}>
              Continue
            </Button>
          ) : null}
        </div>
      </form>
    </FormProvider>
  );
}
