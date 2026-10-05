import type { Metadata } from "next";
import Link from "next/link";
import { Reveal } from "@/components/motion/reveal";
import { Icon } from "@/components/ui/icon";
import { chevronRightIcon } from "@/components/ui/icons.generated";
import { PageHeader } from "@/components/ui/page-header";
import { DataTable, EmptyRow, Mono, RowLink, Td, Th, Tr } from "@/features/admin/data-table";
import { Panel } from "@/features/admin/detail";
import { formatDate, humanize } from "@/features/admin/format";
import { Stat } from "@/features/admin/stat";
import { StatusChip, toneFor } from "@/features/admin/status-chip";
import { formatUsd } from "@/lib/money";
import { getNewestUsers, getOverviewStats, getVerificationQueuePreview } from "@/server/admin/queries";
import { requireAdmin } from "@/server/auth/session";

export const metadata: Metadata = { title: "Overview" };

export default async function AdminHome() {
  await requireAdmin();
  const [stats, queue, recent] = await Promise.all([getOverviewStats(), getVerificationQueuePreview(), getNewestUsers(10)]);

  return (
    <div>
      <PageHeader title="Admin console" description="Marketplace activity, carrier checks and accounts across AllShip AI." />

      <Reveal as="dl" stagger={0.04} className="grid grid-cols-2 gap-x-8 gap-y-6 border-b border-outline-variant pb-6 medium:grid-cols-4">
        <Stat label="Open loads" value={stats.openLoads} href="/admin/loads?status=open" emphasis />
        <Stat label="Bids today" value={stats.bidsToday} emphasis />
        <Stat label="Held in escrow" value={stats.escrowCents} display={formatUsd(stats.escrowCents, true)} href="/admin/payments?status=succeeded" emphasis />
        <Stat label="Carriers to verify" value={stats.pendingVerification} href="/admin/carriers" emphasis />
      </Reveal>
      <dl className="grid grid-cols-2 gap-x-8 gap-y-4 py-5 medium:grid-cols-5">
        <Stat label="Open disputes" value={stats.openDisputes} href="/admin/disputes" />
        <Stat label="Users" value={stats.users} href="/admin/users" />
        <Stat label="Carrier companies" value={stats.carriers} href="/admin/carriers?status=all" />
        <Stat label="Loads, all time" value={stats.loads} href="/admin/loads" />
        <Stat label="New leads" value={stats.newLeads} href="/admin/leads" />
      </dl>

      <div className="grid gap-4 large:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
        <Panel
          title="Verification queue"
          className="self-start"
          description={queue.length ? "Oldest requests first." : undefined}
          flush
          actions={
            <Link href="/admin/carriers" className="state-layer -mr-3 inline-flex h-10 items-center gap-1 rounded-full px-3 text-label-lg font-medium text-primary">
              Open queue
              <Icon icon={chevronRightIcon} size={18} />
            </Link>
          }
        >
          {queue.length === 0 ? (
            <p className="px-6 pb-6 text-body-md text-on-surface-variant">No carriers are waiting. New sign-ups show up here after the FMCSA lookup.</p>
          ) : (
            <ul>
              {queue.map((c) => (
                <li key={c.orgId} className="border-t border-outline-variant">
                  <Link href={`/admin/carriers/${c.orgId}`} className="state-layer flex items-center gap-4 px-6 py-3">
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-body-lg text-on-surface">{c.legalName}</span>
                      <span className="block text-body-sm text-on-surface-variant">
                        USDOT {c.usdot ?? "missing"} · {formatDate(c.createdAt)}
                      </span>
                    </span>
                    <StatusChip label={humanize(c.status)} tone={toneFor(c.status)} />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <DataTable label="Newest accounts" minWidth={560} toolbar={<h2 className="px-6 pt-5 pb-3 text-title-lg">Newest accounts</h2>}>
          <thead>
            <tr>
              <Th>Name</Th>
              <Th>Type</Th>
              <Th>Email</Th>
              <Th>Joined</Th>
            </tr>
          </thead>
          <tbody>
            {recent.map((u) => (
              <Tr key={u.id} interactive>
                <Td>
                  <RowLink href={`/admin/users?q=${encodeURIComponent(u.email)}`}>{u.name}</RowLink>
                  <span className="block text-body-sm text-on-surface-variant">{u.email}</span>
                </Td>
                <Td className="capitalize">{u.accountType}</Td>
                <Td>{u.verified ? <StatusChip label="Confirmed" tone="success" /> : <Mono>Unconfirmed</Mono>}</Td>
                <Td className="whitespace-nowrap text-on-surface-variant">{formatDate(u.createdAt)}</Td>
              </Tr>
            ))}
            {recent.length === 0 && <EmptyRow colSpan={4} title="No accounts yet" />}
          </tbody>
        </DataTable>
      </div>
    </div>
  );
}
