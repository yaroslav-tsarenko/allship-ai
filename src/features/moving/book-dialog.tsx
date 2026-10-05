"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useAction } from "next-safe-action/hooks";
import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";
import { useForm } from "react-hook-form";
import type { z } from "zod";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog } from "@/components/ui/dialog";
import { TextField } from "@/components/ui/text-field";
import { Turnstile } from "@/features/auth/turnstile";
import { InboxScreen } from "@/features/public-load/inbox-screen";
import { formatUsd } from "@/lib/money";
import { bookInstantQuoteAction } from "@/server/actions/matcher";
import type { Match, MatchRoute } from "@/server/matcher/service";
import type { BookingIcons } from "./booking";
import { Breakdown } from "./match-list";
import { contactSchema, type MoveRequestData } from "./schema";

type Results = { route: MatchRoute; volumeCuFt: number; matches: Match[]; requirements: string[]; request: MoveRequestData };
type Step = "confirm" | "contact" | "sent";

export function BookDialog({ match, results, feePercent, onClose, onPriceChange }: { match: Match; results: Results; icons: BookingIcons; feePercent: number; onClose: () => void; onPriceChange: (m: Match) => void }) {
  const router = useRouter();
  const [step, setStep] = useState<Step>("confirm");
  const [sentTo, setSentTo] = useState("");
  const [optIn, setOptIn] = useState(false);
  const [captcha, setCaptcha] = useState<string | null>(null);
  const [captchaReset, setCaptchaReset] = useState(0);
  const [notice, setNotice] = useState<string | null>(null);
  const book = useAction(bookInstantQuoteAction);
  const form = useForm<z.input<typeof contactSchema>, unknown, z.output<typeof contactSchema>>({ resolver: zodResolver(contactSchema), defaultValues: { name: "", email: "", phone: "" } });
  const errors = form.formState.errors;
  const onToken = useCallback((t: string | null) => setCaptcha(t), []);

  const submit = form.handleSubmit(async (contact) => {
    setNotice(null);
    const res = await book.executeAsync({
      request: results.request,
      carrierOrgId: match.carrierOrgId,
      quotedCarrierCents: match.carrierCents,
      contact,
      marketingOptIn: optIn,
      turnstileToken: captcha ?? undefined,
    });
    setCaptchaReset((n) => n + 1);
    const data = res?.data;
    if (!data) return;
    if (data.status === "price_changed") {
      const platformFeeCents = data.shipperTotalCents - data.carrierCents;
      onPriceChange({ ...match, carrierCents: data.carrierCents, platformFeeCents, shipperTotalCents: data.shipperTotalCents });
      setNotice(`${match.name}'s rates changed while you were deciding. The new total is ${formatUsd(data.shipperTotalCents)}. Review it and book again.`);
      setStep("confirm");
      return;
    }
    if (data.status === "booked") {
      router.push(data.href);
      return;
    }
    setSentTo(data.email);
    setStep("sent");
  });

  const title = step === "confirm" ? `Choose ${match.name}?` : step === "contact" ? "Where should we send your booking?" : "Confirm your email to book";
  const description =
    step === "confirm"
      ? `By choosing ${match.name}, you send them a booking request at this price. Your move is also posted so other verified movers can bid. You pay only when you accept.`
      : step === "contact"
        ? "We create your AllShip account with these details. One click in the email confirms it and sends your booking request."
        : undefined;

  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
      title={title}
      description={description}
      className="max-w-[600px]"
      actions={
        step === "confirm" ? (
          <>
            <Button variant="text" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={() => setStep("contact")}>Yes, choose</Button>
          </>
        ) : step === "contact" ? (
          <>
            <Button variant="text" onClick={() => setStep("confirm")}>
              Back
            </Button>
            <Button type="submit" form="moving-contact" loading={book.isPending}>
              Book with {match.name.length > 22 ? "this mover" : match.name}
            </Button>
          </>
        ) : (
          <Button variant="text" onClick={onClose}>
            Close
          </Button>
        )
      }
    >
      {step === "confirm" && (
        <div className="flex flex-col gap-4">
          {notice && <p className="rounded-md bg-warning-container p-3 text-body-md text-on-warning-container">{notice}</p>}
          <p className="text-body-md text-on-surface-variant">
            {results.route.from} → {results.route.to} · {results.request.pickupDate}
          </p>
          <Breakdown match={match} feePercent={feePercent} />
          {results.requirements.length > 0 && <p className="text-body-sm text-on-surface-variant">Also sent to the mover as requirements, not priced: {results.requirements.join(", ").toLowerCase()}.</p>}
          <p className="text-body-sm text-on-surface-variant">The mover confirms inventory, access and dates with you before pickup and can withdraw within 24 hours if they can&rsquo;t take the move.</p>
        </div>
      )}
      {step === "contact" && (
        <form id="moving-contact" onSubmit={submit} noValidate className="flex flex-col gap-4">
          <TextField label="Full name" autoComplete="name" error={errors.name?.message} required {...form.register("name")} />
          <TextField label="Email" type="email" autoComplete="email" inputMode="email" error={errors.email?.message} required {...form.register("email")} />
          <TextField label="Phone" type="tel" autoComplete="tel" inputMode="tel" error={errors.phone?.message} supportingText="The mover calls to confirm details" required {...form.register("phone")} />
          <Checkbox label="Send me moving tips and AllShip news. Unsubscribe anytime." checked={optIn} onCheckedChange={(v) => setOptIn(v === true)} />
          <Turnstile onToken={onToken} resetKey={captchaReset} />
          <p className="text-body-sm text-on-surface-variant">
            Total if you accept: <span className="text-on-surface tabular-nums">{formatUsd(match.shipperTotalCents)}</span>. Nothing is charged now.
          </p>
          <p aria-live="polite" className="text-body-md text-error empty:hidden">
            {book.result.serverError ?? ""}
          </p>
        </form>
      )}
      {step === "sent" && <InboxScreen email={sentTo} onEditEmail={() => setStep("contact")} />}
    </Dialog>
  );
}
