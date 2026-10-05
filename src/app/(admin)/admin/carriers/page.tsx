import type { Metadata } from "next";
import { PageHeader } from "@/components/ui/page-header";
import { DataTable, EmptyRow, Mono, RowLink, Td, Th, Toolbar, Tr } from "@/features/admin/data-table";
import { FilterChips } from "@/features/admin/filter-chips";
import { formatDate, hrefWith, humanize, oneOf, pageParam, param, type SearchParams } from "@/features/admin/format";
import { Pagination } from "@/features/admin/pagination";
import { SearchBox } from "@/features/admin/search-box";
import { StatusChip, toneFor } from "@/features/admin/status-chip";
import { listCarriers, type CarrierFilter } from "@/server/admin/queries";
import { requireAdmin } from "@/server/auth/session";

export const metadata: Metadata = { title: "Carriers" };

const filters: { value: CarrierFilter; label: string }[] = [
  { value: "queue", label: "Needs review" },
  { value: "pending", label: "Pending" },
  { value: "manual_review", label: "Manual review" },
  { value: "verified", label: "Verified" },
  { value: "failed", label: "Failed" },
  { value: "all", label: "All" },
];

function payoutLabel(c: { stripeAccountId: string | null; payoutsEnabled: boolean }) {
  if (c.payoutsEnabled) return <StatusChip label="Active" tone="success" />;
  if (c.stripeAccountId) return <StatusChip label="Onboarding" tone="warning" />;
  return <Mono>Not started</Mono>;
}

export default async function CarriersPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  await requireAdmin();
  const sp = await searchParams;
  const filter = oneOf(param(sp, "status"), filters.map((f) => f.value), "queue");
  const q = param(sp, "q");
  const page = pageParam(sp);
  const data = await listCarriers({ filter, q, page });
  const current = { status: filter === "queue" ? undefined : filter, q };

  return (
    <div>
      <PageHeader title="Carriers" description="Check USDOT and MC authority before carriers can bid." />
      <DataTable
        label="Carrier companies"
        minWidth={980}
        toolbar={
          <Toolbar>
            <FilterChips
              label="Verification status"
              value={filter}
              options={filters.map((f) => ({ ...f, count: data.counts[f.value], href: hrefWith("/admin/carriers", current, { status: f.value === "queue" ? undefined : f.value }) }))}
            />
            <SearchBox action="/admin/carriers" label="Search carriers" placeholder="Name, USDOT or MC" value={q} keep={{ status: current.status }} />
          </Toolbar>
        }
        footer={<Pagination page={data.page} pageCount={data.pageCount} total={data.total} hrefFor={(p) => hrefWith("/admin/carriers", current, { page: p > 1 ? String(p) : undefined })} />}
      >
        <thead>
          <tr>
            <Th>Company</Th>
            <Th>USDOT</Th>
            <Th>MC</Th>
            <Th>Owner</Th>
            <Th>FMCSA</Th>
            <Th>Payouts</Th>
            <Th>Created</Th>
          </tr>
        </thead>
        <tbody>
          {data.rows.map((c) => (
            <Tr key={c.orgId} interactive>
              <Td className="max-w-[280px]">
                <RowLink href={`/admin/carriers/${c.orgId}`} className="block truncate">
                  {c.legalName}
                </RowLink>
                {(c.dbaName || c.name !== c.legalName) && <span className="block truncate text-body-sm text-on-surface-variant">{c.dbaName ? `DBA ${c.dbaName}` : c.name}</span>}
              </Td>
              <Td>{c.usdot ? <span className="font-mono">{c.usdot}</span> : <Mono>Missing</Mono>}</Td>
              <Td>{c.mc ? <span className="font-mono">{c.mc}</span> : <Mono>—</Mono>}</Td>
              <Td className="max-w-[240px] truncate text-on-surface-variant">{c.ownerEmail ?? "—"}</Td>
              <Td>
                <StatusChip label={humanize(c.status)} tone={toneFor(c.status)} />
              </Td>
              <Td>{payoutLabel(c)}</Td>
              <Td className="whitespace-nowrap text-on-surface-variant">{formatDate(c.createdAt)}</Td>
            </Tr>
          ))}
          {data.rows.length === 0 && (
            <EmptyRow colSpan={7} title={q ? `No carriers match “${q}”` : filter === "queue" ? "The queue is clear" : "No carriers here"} detail={filter === "queue" && !q ? "Every carrier has a verification decision." : "Try another filter or search."} />
          )}
        </tbody>
      </DataTable>
    </div>
  );
}
