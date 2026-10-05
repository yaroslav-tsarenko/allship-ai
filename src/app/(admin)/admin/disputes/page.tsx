import type { Metadata } from "next";
import { PageHeader } from "@/components/ui/page-header";
import { DataTable, EmptyRow, RowLink, Td, Th, Toolbar, Tr } from "@/features/admin/data-table";
import { FilterChips } from "@/features/admin/filter-chips";
import { formatDateTime, hrefWith, oneOf, pageParam, param, type SearchParams } from "@/features/admin/format";
import { Pagination } from "@/features/admin/pagination";
import { SearchBox } from "@/features/admin/search-box";
import { StatusChip } from "@/features/admin/status-chip";
import { disputeReasonLabels, disputeStatusLabels, type DisputeReasonValue } from "@/features/disputes/reasons";
import { formatUsd } from "@/lib/money";
import { listDisputes, type DisputeFilter } from "@/server/admin/queries";
import { requireAdmin } from "@/server/auth/session";

export const metadata: Metadata = { title: "Disputes" };

const filters: { value: DisputeFilter; label: string }[] = [
  { value: "open", label: "Open" },
  { value: "resolved", label: "Closed" },
  { value: "all", label: "All" },
];

function age(from: Date) {
  const hours = Math.floor((Date.now() - from.getTime()) / 3_600_000);
  if (hours < 1) return "under 1 h";
  if (hours < 48) return `${hours} h`;
  return `${Math.floor(hours / 24)} days`;
}

export default async function DisputesPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  await requireAdmin();
  const sp = await searchParams;
  const filter = oneOf(param(sp, "status"), filters.map((f) => f.value), "open");
  const q = param(sp, "q");
  const page = pageParam(sp);
  const data = await listDisputes({ filter, q, page });
  const current = { status: filter === "open" ? undefined : filter, q };

  return (
    <div>
      <PageHeader title="Disputes" description="Problems reported on booked loads. Payment stays in escrow until you resolve them. Oldest open disputes first." />
      <DataTable
        label="Disputes"
        minWidth={1000}
        toolbar={
          <Toolbar>
            <FilterChips
              label="Dispute status"
              value={filter}
              options={filters.map((f) => ({ ...f, count: data.counts[f.value], href: hrefWith("/admin/disputes", current, { status: f.value === "open" ? undefined : f.value }) }))}
            />
            <SearchBox action="/admin/disputes" label="Search disputes" placeholder="Load ID, title or email" value={q} keep={{ status: current.status }} />
          </Toolbar>
        }
        footer={<Pagination page={data.page} pageCount={data.pageCount} total={data.total} hrefFor={(p) => hrefWith("/admin/disputes", current, { page: p > 1 ? String(p) : undefined })} />}
      >
        <thead>
          <tr>
            <Th>Load</Th>
            <Th>Reason</Th>
            <Th>Opened by</Th>
            <Th>Carrier</Th>
            <Th numeric>In escrow</Th>
            <Th>Status</Th>
            <Th>Opened</Th>
          </tr>
        </thead>
        <tbody>
          {data.rows.map((d) => (
            <Tr key={d.id} interactive>
              <Td className="max-w-[240px]">
                <RowLink href={`/admin/disputes/${d.id}`} className="font-mono text-body-md">
                  {d.publicId}
                </RowLink>
                <span className="block truncate text-body-sm text-on-surface-variant">{d.loadTitle}</span>
              </Td>
              <Td className="max-w-[280px]">
                <span className="block text-on-surface">{disputeReasonLabels[d.reason as DisputeReasonValue]}</span>
                <span className="block truncate text-body-sm text-on-surface-variant" title={d.details}>
                  {d.details}
                </span>
              </Td>
              <Td className="max-w-[200px]">
                <span className="block truncate">{d.openerName}</span>
                <span className="block text-body-sm text-on-surface-variant capitalize">{d.openedByRole}</span>
              </Td>
              <Td className="max-w-[180px] truncate text-on-surface-variant">{d.carrierName ?? "—"}</Td>
              <Td numeric className="font-mono">{d.amountCents != null ? formatUsd(d.amountCents) : "—"}</Td>
              <Td>
                <StatusChip label={disputeStatusLabels[d.status] ?? d.status} tone={d.status === "open" ? "danger" : d.status === "withdrawn" ? "neutral" : "success"} />
              </Td>
              <Td className="whitespace-nowrap text-on-surface-variant">
                {formatDateTime(d.createdAt)}
                {d.status === "open" && <span className="block text-body-sm text-error">Waiting {age(d.createdAt)}</span>}
              </Td>
            </Tr>
          ))}
          {data.rows.length === 0 && (
            <EmptyRow colSpan={7} title={q ? `No disputes match “${q}”` : filter === "open" ? "No open disputes" : "No disputes yet"} detail={filter === "open" && !q ? "When a shipper or carrier reports a problem, it shows up here." : undefined} />
          )}
        </tbody>
      </DataTable>
    </div>
  );
}
