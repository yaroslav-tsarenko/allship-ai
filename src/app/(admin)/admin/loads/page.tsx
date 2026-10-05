import type { Metadata } from "next";
import { PageHeader } from "@/components/ui/page-header";
import { DataTable, EmptyRow, RowLink, Td, Th, Toolbar, Tr } from "@/features/admin/data-table";
import { FilterChips } from "@/features/admin/filter-chips";
import { formatDate, formatPlace, hrefWith, oneOf, pageParam, param, type SearchParams } from "@/features/admin/format";
import { Pagination } from "@/features/admin/pagination";
import { SearchBox } from "@/features/admin/search-box";
import { StatusChip, toneFor } from "@/features/admin/status-chip";
import { listLoads, type LoadFilter } from "@/server/admin/queries";
import { requireAdmin } from "@/server/auth/session";
import { categoryLabel } from "@/server/loads/service";
import { statusLabels } from "@/server/loads/transitions";

export const metadata: Metadata = { title: "Loads" };

const filters: { value: LoadFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "active", label: "Active" },
  { value: "open", label: "Open" },
  { value: "awaiting_payment", label: "Awaiting payment" },
  { value: "booked", label: "Booked" },
  { value: "in_transit", label: "In transit" },
  { value: "delivered", label: "Delivered" },
  { value: "completed", label: "Completed" },
  { value: "disputed", label: "Disputed" },
  { value: "cancelled", label: "Cancelled" },
  { value: "draft", label: "Draft" },
];

export default async function LoadsPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  await requireAdmin();
  const sp = await searchParams;
  const filter = oneOf(param(sp, "status"), filters.map((f) => f.value), "all");
  const q = param(sp, "q");
  const page = pageParam(sp);
  const data = await listLoads({ filter, q, page });
  const current = { status: filter === "all" ? undefined : filter, q };
  const countFor = (f: LoadFilter) => (f === "all" ? data.allCount : f === "active" ? data.activeCount : (data.counts[f] ?? 0));

  return (
    <div>
      <PageHeader title="Loads" description="Every shipment posted on the marketplace." />
      <DataTable
        label="Loads"
        minWidth={1080}
        toolbar={
          <Toolbar>
            <FilterChips
              label="Load status"
              value={filter}
              options={filters.map((f) => ({ ...f, count: countFor(f.value), href: hrefWith("/admin/loads", current, { status: f.value === "all" ? undefined : f.value }) }))}
            />
            <SearchBox action="/admin/loads" label="Search loads" placeholder="Load ID or title" value={q} keep={{ status: current.status }} />
          </Toolbar>
        }
        footer={<Pagination page={data.page} pageCount={data.pageCount} total={data.total} hrefFor={(p) => hrefWith("/admin/loads", current, { page: p > 1 ? String(p) : undefined })} />}
      >
        <thead>
          <tr>
            <Th>Load</Th>
            <Th>Title</Th>
            <Th>Category</Th>
            <Th>Shipper</Th>
            <Th>Status</Th>
            <Th numeric>Bids</Th>
            <Th>Route</Th>
            <Th>Created</Th>
          </tr>
        </thead>
        <tbody>
          {data.rows.map((l) => (
            <Tr key={l.id} interactive>
              <Td>
                <RowLink href={`/admin/loads/${l.publicId}`} className="font-mono text-body-md">
                  {l.publicId}
                </RowLink>
              </Td>
              <Td className="max-w-[260px] truncate text-on-surface">{l.title}</Td>
              <Td className="whitespace-nowrap text-on-surface-variant">{categoryLabel(l.category)}</Td>
              <Td className="max-w-[200px]">
                <span className="block truncate">{l.shipperName}</span>
                <span className="block truncate text-body-sm text-on-surface-variant">{l.shipperEmail}</span>
              </Td>
              <Td>
                <StatusChip label={statusLabels[l.status]} tone={toneFor(l.status)} />
              </Td>
              <Td numeric>{l.bids}</Td>
              <Td className="max-w-[260px] truncate text-on-surface-variant">
                {formatPlace(l.pickup)} → {formatPlace(l.dropoff)}
              </Td>
              <Td className="whitespace-nowrap text-on-surface-variant">{formatDate(l.createdAt)}</Td>
            </Tr>
          ))}
          {data.rows.length === 0 && <EmptyRow colSpan={8} title={q ? `No loads match “${q}”` : "No loads yet"} detail={q || filter !== "all" ? "Try another status or search." : "Loads appear here once shippers post them."} />}
        </tbody>
      </DataTable>
    </div>
  );
}
