import type { Metadata } from "next";
import { PageHeader } from "@/components/ui/page-header";
import { DataTable, EmptyRow, Mono, Td, Th, Toolbar, Tr } from "@/features/admin/data-table";
import { FilterChips } from "@/features/admin/filter-chips";
import { formatDateTime, hrefWith, humanize, oneOf, pageParam, param, type SearchParams } from "@/features/admin/format";
import { Pagination } from "@/features/admin/pagination";
import { SearchBox } from "@/features/admin/search-box";
import { StatusChip, toneFor } from "@/features/admin/status-chip";
import { listLeads, type LeadFilter } from "@/server/admin/queries";
import { requireAdmin } from "@/server/auth/session";

export const metadata: Metadata = { title: "Leads" };

const filters: { value: LeadFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "quote", label: "Quotes" },
  { value: "contact", label: "Contact" },
  { value: "carrier", label: "Carrier" },
  { value: "partner", label: "Partner" },
  { value: "newsletter", label: "Newsletter" },
];

function summary(payload: Record<string, unknown>) {
  const pick = ["category", "subject", "message", "pickup", "dropoff", "company"];
  for (const key of pick) {
    const v = payload[key];
    if (typeof v === "string" && v) return v;
    if (v && typeof v === "object" && "address" in v && typeof v.address === "string") return v.address;
  }
  return null;
}

export default async function LeadsPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  await requireAdmin();
  const sp = await searchParams;
  const filter = oneOf(param(sp, "type"), filters.map((f) => f.value), "all");
  const q = param(sp, "q");
  const page = pageParam(sp);
  const data = await listLeads({ filter, q, page });
  const current = { type: filter === "all" ? undefined : filter, q };

  return (
    <div>
      <PageHeader title="Leads" description="Quote requests and contact forms from the public site, with campaign attribution." />
      <DataTable
        label="Leads"
        minWidth={1180}
        toolbar={
          <Toolbar>
            <FilterChips label="Lead type" value={filter} options={filters.map((f) => ({ ...f, count: data.counts[f.value] ?? 0, href: hrefWith("/admin/leads", current, { type: f.value === "all" ? undefined : f.value }) }))} />
            <SearchBox action="/admin/leads" label="Search leads" placeholder="Name, email, phone or gclid" value={q} keep={{ type: current.type }} />
          </Toolbar>
        }
        footer={<Pagination page={data.page} pageCount={data.pageCount} total={data.total} hrefFor={(p) => hrefWith("/admin/leads", current, { page: p > 1 ? String(p) : undefined })} />}
      >
        <thead>
          <tr>
            <Th>Contact</Th>
            <Th>Type</Th>
            <Th>Status</Th>
            <Th>Details</Th>
            <Th>Source / medium</Th>
            <Th>Campaign</Th>
            <Th>gclid</Th>
            <Th>Received</Th>
          </tr>
        </thead>
        <tbody>
          {data.rows.map((l) => {
            const source = [l.utm.utm_source ?? l.utm.source, l.utm.utm_medium ?? l.utm.medium].filter(Boolean).join(" / ");
            const campaign = l.utm.utm_campaign ?? l.utm.campaign;
            const detail = summary(l.payload);
            return (
              <Tr key={l.id}>
                <Td className="max-w-[240px]">
                  <span className="block truncate text-on-surface">{l.name ?? l.email ?? "Anonymous"}</span>
                  <span className="block truncate text-body-sm text-on-surface-variant">{[l.name ? l.email : null, l.phone].filter(Boolean).join(" · ") || "—"}</span>
                </Td>
                <Td className="capitalize">{l.type}</Td>
                <Td>
                  <StatusChip label={humanize(l.status)} tone={toneFor(l.status)} />
                </Td>
                <Td className="max-w-[260px] truncate text-on-surface-variant" title={detail ?? undefined}>
                  {detail ?? "—"}
                </Td>
                <Td className="whitespace-nowrap">{source ? <Mono>{source}</Mono> : <Mono>direct</Mono>}</Td>
                <Td className="max-w-[180px] truncate">{campaign ? <Mono>{campaign}</Mono> : "—"}</Td>
                <Td className="max-w-[160px]" title={l.gclid ?? undefined}>
                  {l.gclid ? <Mono className="block truncate">{l.gclid}</Mono> : "—"}
                </Td>
                <Td className="whitespace-nowrap text-on-surface-variant">{formatDateTime(l.createdAt)}</Td>
              </Tr>
            );
          })}
          {data.rows.length === 0 && <EmptyRow colSpan={8} title={q ? `No leads match “${q}”` : "No leads yet"} detail="Leads come from the quote flow, contact form and newsletter." />}
        </tbody>
      </DataTable>
    </div>
  );
}
