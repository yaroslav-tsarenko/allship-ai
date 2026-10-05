import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Reveal } from "@/components/motion/reveal";
import { Card } from "@/components/ui/card";
import { Icon } from "@/components/ui/icon";
import { accountBalanceWalletIcon, checkCircleIcon, infoIcon, scheduleIcon } from "@/components/ui/icons.generated";
import { PageHeader } from "@/components/ui/page-header";
import { StatusChip, type StatusTone } from "@/components/ui/status-chip";
import { formatDay } from "@/features/board/format";
import { PayoutActions } from "@/features/payouts/payout-actions";
import { getPayoutOverview, type PayoutSetup } from "@/features/payouts/queries";
import { formatUsd } from "@/lib/money";
import { paymentsConfigured } from "@/server/payments/stripe";
import { getViewer } from "@/server/viewer/viewer";

export const metadata: Metadata = { title: "Payouts" };

const setupCopy: Record<PayoutSetup, { chip: string; tone: StatusTone; title: string; body: string }> = {
  not_started: {
    chip: "Not set up",
    tone: "neutral",
    title: "Get paid for the loads you win",
    body: "Connect a Stripe account in your company's name. Stripe asks for your EIN, a company representative and the bank account to pay into. It usually takes about five minutes.",
  },
  pending: {
    chip: "In progress",
    tone: "warning",
    title: "Stripe needs a few more details",
    body: "Your Stripe account exists, but payouts aren't turned on yet. Continue setup to finish, or refresh if you just completed it.",
  },
  enabled: {
    chip: "Active",
    tone: "success",
    title: "Payouts are on",
    body: "Shippers can book you, and money for delivered loads goes straight to your Stripe account. Update bank details or tax info in the Stripe dashboard.",
  },
};

const steps = [
  { title: "The shipper pays into escrow", body: "When a shipper accepts your bid, they pay the full amount up front. We hold it until the job is done." },
  { title: "You deliver", body: "The shipper confirms delivery in AllShip. That's the moment your payment is released." },
  { title: "You get 100% of your bid", body: "Our fee is charged to the shipper, never taken out of your price. Stripe then deposits it to your bank on your payout schedule." },
];

const payoutStatus: Record<string, { label: string; tone: StatusTone }> = {
  pending: { label: "Waiting on delivery", tone: "neutral" },
  scheduled: { label: "Scheduled", tone: "secondary" },
  held: { label: "On hold", tone: "warning" },
  paid: { label: "Paid", tone: "success" },
  reversed: { label: "Reversed", tone: "error" },
};

export default async function PayoutsPage({ searchParams }: { searchParams: Promise<{ return?: string; refresh?: string }> }) {
  const viewer = await getViewer();
  if (viewer.role !== "owner" || !viewer.org?.orgId) redirect("/app");
  const params = await searchParams;
  const configured = paymentsConfigured();
  const overview = await getPayoutOverview(viewer.org.orgId);
  const copy = setupCopy[overview.setup];
  const landing = params.return === "1" ? "return" : params.refresh === "1" ? "refresh" : null;

  return (
    <div className="mx-auto max-w-[960px]">
      <PageHeader title="Payouts" description={`Where ${viewer.org.orgName} gets paid for delivered loads.`} />
      <Reveal stagger={0.06} className="flex flex-col gap-6">
        <Card as="section" aria-labelledby="setup-title" className="p-5 medium:p-6">
          <div className="flex flex-wrap items-center gap-3">
            <Icon icon={overview.setup === "enabled" ? checkCircleIcon : accountBalanceWalletIcon} filled={overview.setup === "enabled"} className={overview.setup === "enabled" ? "text-success" : "text-on-surface-variant"} />
            <h2 id="setup-title" className="text-title-lg text-on-surface">
              {configured ? copy.title : "Stripe payouts"}
            </h2>
            {configured && (
              <StatusChip tone={copy.tone} size="sm" className="ml-auto">
                {copy.chip}
              </StatusChip>
            )}
          </div>
          {configured ? (
            <>
              <p className="mt-2 max-w-[640px] text-body-lg text-on-surface-variant">{copy.body}</p>
              <div className="mt-5">
                <PayoutActions setup={overview.setup} landing={landing} />
              </div>
            </>
          ) : (
            <div className="mt-3 flex gap-3 rounded-sm bg-surface-container-high p-4">
              <Icon icon={infoIcon} size={20} className="mt-0.5 shrink-0 text-on-surface-variant" />
              <p className="text-body-md text-on-surface-variant">
                Payments aren&apos;t configured in this environment, so there&apos;s no Stripe account to connect. Bookings use simulated payments here, and nothing is paid out.
              </p>
            </div>
          )}
        </Card>

        <section aria-labelledby="how-title">
          <h2 id="how-title" className="px-1 text-title-lg text-on-surface">
            How you get paid
          </h2>
          <ol className="mt-3 grid gap-px overflow-hidden rounded-md border border-outline-variant bg-outline-variant expanded:grid-cols-3">
            {steps.map((s, i) => (
              <li key={s.title} className="bg-surface p-5">
                <span className="text-label-lg text-primary tabular-nums">Step {i + 1}</span>
                <p className="mt-1 text-title-md text-on-surface">{s.title}</p>
                <p className="mt-1 text-body-md text-on-surface-variant">{s.body}</p>
              </li>
            ))}
          </ol>
        </section>

        <Card as="section" aria-labelledby="history-title" className="overflow-hidden">
          <div className="flex flex-wrap items-end gap-x-8 gap-y-3 px-5 pt-5 pb-4 medium:px-6">
            <h2 id="history-title" className="mr-auto text-title-lg text-on-surface">
              Payout history
            </h2>
            <div>
              <p className="text-body-sm text-on-surface-variant">On the way</p>
              <p className="text-title-lg text-on-surface tabular-nums">{formatUsd(overview.upcomingCents)}</p>
            </div>
            <div>
              <p className="text-body-sm text-on-surface-variant">Paid out</p>
              <p className="text-title-lg text-on-surface tabular-nums">{formatUsd(overview.paidCents)}</p>
            </div>
          </div>
          {overview.recent.length === 0 ? (
            <p className="flex items-center gap-3 border-t border-outline-variant px-5 py-6 text-body-md text-on-surface-variant medium:px-6">
              <Icon icon={scheduleIcon} size={20} />
              Payouts appear here after your first delivered load.
            </p>
          ) : (
            <ul>
              {overview.recent.map((p) => {
                const st = payoutStatus[p.status] ?? { label: p.status, tone: "neutral" as const };
                return (
                  <li key={p.id} className="flex items-center gap-4 border-t border-outline-variant px-5 py-3.5 medium:px-6">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-body-lg text-on-surface">{p.loadTitle}</p>
                      <p className="text-body-sm text-on-surface-variant">
                        {p.loadPublicId} · {p.paidAt ? `Paid ${formatDay(p.paidAt, true)}` : `Created ${formatDay(p.createdAt, true)}`}
                      </p>
                    </div>
                    <StatusChip tone={st.tone} size="sm" className="hidden medium:inline-flex">
                      {st.label}
                    </StatusChip>
                    <p className="shrink-0 text-title-md text-on-surface tabular-nums">{formatUsd(p.amountCents)}</p>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>
      </Reveal>
    </div>
  );
}
