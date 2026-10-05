import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/ui/page-header";
import { DataTable, EmptyRow, Mono, Td, Th, Toolbar, Tr } from "@/features/admin/data-table";
import { FilterChips } from "@/features/admin/filter-chips";
import { formatDateTime, hrefWith, humanize, oneOf, pageParam, param, type SearchParams } from "@/features/admin/format";
import { Pagination } from "@/features/admin/pagination";
import { SearchBox } from "@/features/admin/search-box";
import { Stat } from "@/features/admin/stat";
import { StatusChip, toneFor } from "@/features/admin/status-chip";
import { formatUsd } from "@/lib/money";
import { RetryPayoutButton } from "@/features/admin/trip-admin-actions";
import { listPayments, listPayouts, type PaymentFilter, type PayoutFilter } from "@/server/admin/queries";
import { requireAdmin } from "@/server/auth/session";

export const metadata: Metadata = { title: "Payments" };

const filters: { value: PaymentFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "succeeded", label: "Succeeded" },
  { value: "processing", label: "Processing" },
  { value: "requires_payment", label: "Unpaid" },
  { value: "refunded", label: "Refunded" },
  { value: "disputed", label: "Disputed" },
  { value: "failed", label: "Failed" },
];

const payoutFilters: { value: PayoutFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "attention", label: "Needs attention" },
  { value: "paid", label: "Paid" },
];

export default async function PaymentsPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  await requireAdmin();
  const sp = await searchParams;
  const filter = oneOf(param(sp, "status"), filters.map((f) => f.value), "all");
  const q = param(sp, "q");
  const page = pageParam(sp);
  const payoutFilter = oneOf(param(sp, "payouts"), payoutFilters.map((f) => f.value), "all");
  const payoutPage = Number(param(sp, "ppage")) > 0 ? Number(param(sp, "ppage")) : 1;
  const [data, payouts] = await Promise.all([listPayments({ filter, q, page }), listPayouts({ filter: payoutFilter, page: payoutPage })]);
  const current = { status: filter === "all" ? undefined : filter, q, payouts: payoutFilter === "all" ? undefined : payoutFilter };

  return (
    <div>
      <PageHeader title="Payments" description="Shipper charges held in escrow and carrier payouts." />
      <dl className="mb-6 grid grid-cols-2 gap-x-8 gap-y-4 medium:grid-cols-3">
        <Stat label="Captured" value={data.totals.capturedCents} display={formatUsd(data.totals.capturedCents, true)} />
        <Stat label="Platform fees" value={data.totals.feesCents} display={formatUsd(data.totals.feesCents, true)} />
        <Stat label="Refunded" value={data.totals.refundedCents} display={formatUsd(data.totals.refundedCents, true)} />
      </dl>
      <DataTable
        label="Payments"
        minWidth={1000}
        toolbar={
          <Toolbar>
            <FilterChips label="Payment status" value={filter} options={filters.map((f) => ({ ...f, href: hrefWith("/admin/payments", current, { status: f.value === "all" ? undefined : f.value }) }))} />
            <SearchBox action="/admin/payments" label="Search payments" placeholder="Load ID, pi_… or email" value={q} keep={{ status: current.status }} />
          </Toolbar>
        }
        footer={<Pagination page={data.page} pageCount={data.pageCount} total={data.total} hrefFor={(p) => hrefWith("/admin/payments", current, { page: p > 1 ? String(p) : undefined })} />}
      >
        <thead>
          <tr>
            <Th>Load</Th>
            <Th>Status</Th>
            <Th numeric>Charged</Th>
            <Th numeric>To carrier</Th>
            <Th numeric>Fee</Th>
            <Th numeric>Refunded</Th>
            <Th>Payout</Th>
            <Th>Stripe</Th>
            <Th>Created</Th>
          </tr>
        </thead>
        <tbody>
          {data.rows.map((p) => (
            <Tr key={p.id} interactive>
              <Td className="max-w-[240px]">
                <Link href={`/admin/loads/${p.publicId}`} className="font-mono font-medium text-on-surface outline-none after:absolute after:inset-0 after:content-['']">
                  {p.publicId}
                </Link>
                <span className="block truncate text-body-sm text-on-surface-variant">{p.shipperEmail}</span>
              </Td>
              <Td>
                <StatusChip label={humanize(p.status)} tone={toneFor(p.status)} />
              </Td>
              <Td numeric className="font-mono text-on-surface">{formatUsd(p.amountCents)}</Td>
              <Td numeric className="font-mono">{formatUsd(p.carrierAmountCents)}</Td>
              <Td numeric className="font-mono">{formatUsd(p.platformFeeCents)}</Td>
              <Td numeric className="font-mono text-on-surface-variant">{p.refundedCents ? formatUsd(p.refundedCents) : "—"}</Td>
              <Td>{p.payoutStatus ? <StatusChip label={humanize(p.payoutStatus)} tone={toneFor(p.payoutStatus)} /> : <Mono>—</Mono>}</Td>
              <Td className="max-w-[220px]">
                <Mono className="block truncate">{p.stripePaymentIntentId ?? "Simulated"}</Mono>
                {p.stripeTransferId && <Mono className="block truncate">{p.stripeTransferId}</Mono>}
              </Td>
              <Td className="whitespace-nowrap text-on-surface-variant">{formatDateTime(p.createdAt)}</Td>
            </Tr>
          ))}
          {data.rows.length === 0 && <EmptyRow colSpan={9} title={q ? `No payments match “${q}”` : "No payments yet"} detail={q || filter !== "all" ? "Try another status or search." : "Payments appear when a shipper accepts a bid."} />}
        </tbody>
      </DataTable>

      <section aria-labelledby="payouts-title" className="mt-8">
        <h2 id="payouts-title" className="mb-1 text-title-lg text-on-surface">
          Carrier payouts
        </h2>
        <p className="mb-4 text-body-md text-on-surface-variant">
          {payouts.attention > 0 ? `${payouts.attention} ${payouts.attention === 1 ? "transfer needs" : "transfers need"} attention. Held transfers failed and can be retried once the carrier fixes their Stripe account.` : "All released payouts have been transferred."}
        </p>
        <DataTable
          label="Carrier payouts"
          minWidth={960}
          toolbar={
            <Toolbar>
              <FilterChips
                label="Payout status"
                value={payoutFilter}
                options={payoutFilters.map((f) => ({ ...f, count: f.value === "attention" ? payouts.attention : undefined, href: hrefWith("/admin/payments", current, { payouts: f.value === "all" ? undefined : f.value, ppage: undefined }) }))}
              />
            </Toolbar>
          }
          footer={<Pagination page={payouts.page} pageCount={payouts.pageCount} total={payouts.total} hrefFor={(p) => hrefWith("/admin/payments", current, { ppage: p > 1 ? String(p) : undefined })} />}
        >
          <thead>
            <tr>
              <Th>Load</Th>
              <Th>Carrier</Th>
              <Th numeric>Amount</Th>
              <Th>Status</Th>
              <Th>Transfer</Th>
              <Th>Released</Th>
              <Th>
                <span className="sr-only">Actions</span>
              </Th>
            </tr>
          </thead>
          <tbody>
            {payouts.rows.map((po) => (
              <Tr key={po.id}>
                <Td>
                  <Link href={`/admin/loads/${po.publicId}`} className="font-mono font-medium text-on-surface underline-offset-2 hover:underline">
                    {po.publicId}
                  </Link>
                </Td>
                <Td className="max-w-[220px]">
                  <Link href={`/admin/carriers/${po.carrierOrgId}`} className="block truncate text-on-surface underline-offset-2 hover:underline">
                    {po.carrierName}
                  </Link>
                </Td>
                <Td numeric className="font-mono text-on-surface">{formatUsd(po.amountCents)}</Td>
                <Td className="max-w-[280px]">
                  <StatusChip label={humanize(po.status)} tone={toneFor(po.status)} />
                  {po.failureReason && <span className="mt-1 block text-body-sm text-error">{po.failureReason}</span>}
                </Td>
                <Td className="max-w-[220px]">
                  <Mono className="block truncate">{po.stripeTransferId ?? "—"}</Mono>
                </Td>
                <Td className="whitespace-nowrap text-on-surface-variant">
                  {formatDateTime(po.createdAt)}
                  {po.paidAt && <span className="block text-body-sm">Paid {formatDateTime(po.paidAt)}</span>}
                </Td>
                <Td className="text-right">{(po.status === "held" || po.status === "pending") && <RetryPayoutButton payoutId={po.id} label={po.publicId} />}</Td>
              </Tr>
            ))}
            {payouts.rows.length === 0 && <EmptyRow colSpan={7} title={payoutFilter === "attention" ? "Nothing needs attention" : "No payouts yet"} detail="Payouts are created when a load is completed." />}
          </tbody>
        </DataTable>
      </section>
    </div>
  );
}
