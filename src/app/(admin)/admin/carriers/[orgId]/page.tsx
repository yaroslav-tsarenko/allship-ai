import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/ui/page-header";
import { DataTable, EmptyRow, Mono, Td, Th, Tr } from "@/features/admin/data-table";
import { BackLink, Fields, Panel, Timeline } from "@/features/admin/detail";
import { formatDate, formatDateTime, humanize } from "@/features/admin/format";
import { StatusChip, toneFor } from "@/features/admin/status-chip";
import { VerificationActions } from "@/features/admin/verification-actions";
import { getCarrierDetail } from "@/server/admin/queries";
import { requireAdmin } from "@/server/auth/session";

export const metadata: Metadata = { title: "Carrier" };

function prettySnapshot(raw: string | null) {
  if (!raw) return null;
  try {
    return JSON.stringify(JSON.parse(raw), null, 2);
  } catch {
    return raw;
  }
}

function auditTitle(action: string, diff: Record<string, unknown> | null) {
  const status = typeof diff?.status === "string" ? diff.status : null;
  if (action === "carrier.verification" && status) return `Verification set to ${humanize(status).toLowerCase()}`;
  return humanize(action);
}

export default async function CarrierDetailPage({ params }: { params: Promise<{ orgId: string }> }) {
  await requireAdmin();
  const { orgId } = await params;
  const data = await getCarrierDetail(decodeURIComponent(orgId));
  if (!data) notFound();
  const { profile, org } = data;
  const snapshot = prettySnapshot(profile.fmcsaSnapshot);

  return (
    <div>
      <BackLink href="/admin/carriers" label="Carriers" />
      <PageHeader
        title={profile.legalName}
        description={
          <span className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <StatusChip label={humanize(profile.fmcsaStatus)} tone={toneFor(profile.fmcsaStatus)} />
            <span>
              {profile.fmcsaCheckedAt ? `Last checked ${formatDateTime(profile.fmcsaCheckedAt)}` : "Not checked yet"}
            </span>
          </span>
        }
        actions={<VerificationActions orgId={org.id} status={profile.fmcsaStatus} companyName={profile.legalName} />}
      />

      <div className="grid gap-4 large:grid-cols-[minmax(0,7fr)_minmax(0,5fr)]">
        <div className="flex min-w-0 flex-col gap-4">
          <Panel title="Company">
            <Fields
              items={[
                { label: "Legal name", value: profile.legalName },
                { label: "DBA", value: profile.dbaName },
                { label: "USDOT", value: profile.usdotNumber, mono: true },
                { label: "MC", value: profile.mcNumber, mono: true },
                { label: "Workspace name", value: org.name },
                { label: "Slug", value: org.slug, mono: true },
                { label: "Phone", value: profile.phone },
                { label: "Website", value: profile.website },
                { label: "Years in business", value: profile.yearsInBusiness },
                { label: "Insurance expires", value: profile.insuranceExpiresAt ? formatDate(profile.insuranceExpiresAt) : null },
                { label: "Service states", value: profile.serviceStates.length ? profile.serviceStates.join(", ") : null },
                { label: "Equipment", value: profile.equipment.length ? profile.equipment.join(", ") : null },
                { label: "Categories", value: profile.categories.length ? profile.categories.map(humanize).join(", ") : null },
                { label: "Created", value: formatDateTime(profile.createdAt) },
              ]}
            />
            {profile.about && <p className="mt-5 border-t border-outline-variant pt-4 text-body-md whitespace-pre-line text-on-surface-variant">{profile.about}</p>}
          </Panel>

          <DataTable label="Members" minWidth={560} toolbar={<h2 className="px-6 pt-5 pb-3 text-title-lg">Members</h2>}>
            <thead>
              <tr>
                <Th>Name</Th>
                <Th>Role</Th>
                <Th>2-Step</Th>
                <Th>Joined</Th>
              </tr>
            </thead>
            <tbody>
              {data.members.map((m) => (
                <Tr key={m.id}>
                  <Td>
                    <span className="block text-on-surface">{m.name}</span>
                    <span className="block text-body-sm text-on-surface-variant">{m.email}</span>
                  </Td>
                  <Td className="capitalize">{m.role}</Td>
                  <Td>{m.twoFactor ? <StatusChip label="On" tone="success" /> : <Mono>Off</Mono>}</Td>
                  <Td className="whitespace-nowrap text-on-surface-variant">{formatDate(m.joinedAt)}</Td>
                </Tr>
              ))}
              {data.members.length === 0 && <EmptyRow colSpan={4} title="No members" detail="This company has no users attached." />}
            </tbody>
          </DataTable>

          <Panel title="FMCSA record" description={snapshot ? "Raw response saved at the last lookup." : undefined}>
            {snapshot ? (
              <pre className="max-h-[420px] overflow-auto rounded-sm bg-surface-container p-4 font-mono text-body-sm text-on-surface">{snapshot}</pre>
            ) : (
              <p className="text-body-md text-on-surface-variant">No lookup stored. The record appears here after the automatic FMCSA check runs for this USDOT number.</p>
            )}
          </Panel>
        </div>

        <div className="flex min-w-0 flex-col gap-4">
          <Panel title="Marketplace">
            <Fields
              items={[
                { label: "Bids placed", value: data.bidCount.toLocaleString("en-US") },
                { label: "Loads won", value: data.loadsWon.toLocaleString("en-US") },
                { label: "Stripe account", value: profile.stripeAccountId, mono: true },
                { label: "Charges", value: profile.chargesEnabled ? "Enabled" : "Disabled" },
                { label: "Payouts", value: profile.payoutsEnabled ? "Enabled" : profile.stripeAccountId ? "Onboarding" : "Not started" },
              ]}
            />
          </Panel>
          <Panel title="Audit history">
            <Timeline
              empty="No admin actions recorded for this company yet."
              items={data.audit.map((a) => ({
                id: a.id,
                title: auditTitle(a.action, a.diff),
                meta: `${a.actorName ?? a.actorEmail ?? "System"} · ${formatDateTime(a.createdAt)}`,
                body: typeof a.diff?.note === "string" && a.diff.note ? <q>{a.diff.note}</q> : undefined,
              }))}
            />
          </Panel>
        </div>
      </div>
    </div>
  );
}
