import type { Metadata } from "next";
import { PageHeader } from "@/components/ui/page-header";
import { CreateUserDialog } from "@/features/admin/create-user-dialog";
import { DataTable, EmptyRow, Mono, Td, Th, Toolbar, Tr } from "@/features/admin/data-table";
import { FilterChips } from "@/features/admin/filter-chips";
import { formatDate, hrefWith, oneOf, pageParam, param, type SearchParams } from "@/features/admin/format";
import { Pagination } from "@/features/admin/pagination";
import { SearchBox } from "@/features/admin/search-box";
import { StatusChip } from "@/features/admin/status-chip";
import { listUsers, type UserFilter } from "@/server/admin/queries";
import { requireAdmin } from "@/server/auth/session";

export const metadata: Metadata = { title: "Users" };

const filters: { value: UserFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "shipper", label: "Shippers" },
  { value: "carrier", label: "Carriers" },
  { value: "admin", label: "Admins" },
  { value: "no_2fa", label: "No 2-Step" },
  { value: "banned", label: "Banned" },
];

export default async function UsersPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  await requireAdmin();
  const sp = await searchParams;
  const filter = oneOf(param(sp, "filter"), filters.map((f) => f.value), "all");
  const q = param(sp, "q");
  const page = pageParam(sp);
  const data = await listUsers({ filter, q, page });
  const current = { filter: filter === "all" ? undefined : filter, q };

  return (
    <div>
      <PageHeader title="Users" description="Everyone with an AllShip AI account." actions={<CreateUserDialog />} />
      <DataTable
        label="Users"
        minWidth={1000}
        toolbar={
          <Toolbar>
            <FilterChips label="User filter" value={filter} options={filters.map((f) => ({ ...f, href: hrefWith("/admin/users", current, { filter: f.value === "all" ? undefined : f.value }) }))} />
            <SearchBox action="/admin/users" label="Search users" placeholder="Name, email, phone or ID" value={q} keep={{ filter: current.filter }} />
          </Toolbar>
        }
        footer={<Pagination page={data.page} pageCount={data.pageCount} total={data.total} hrefFor={(p) => hrefWith("/admin/users", current, { page: p > 1 ? String(p) : undefined })} />}
      >
        <thead>
          <tr>
            <Th>User</Th>
            <Th>Account</Th>
            <Th>Company</Th>
            <Th>Role</Th>
            <Th>Email</Th>
            <Th>2-Step</Th>
            <Th>Access</Th>
            <Th>Joined</Th>
          </tr>
        </thead>
        <tbody>
          {data.rows.map((u) => (
            <Tr key={u.id}>
              <Td className="max-w-[280px]">
                <span className="block truncate text-on-surface">{u.name}</span>
                <span className="block truncate text-body-sm text-on-surface-variant">{u.email}</span>
              </Td>
              <Td className="capitalize">{u.accountType}</Td>
              <Td className="max-w-[200px] truncate text-on-surface-variant">{u.orgName ?? "—"}</Td>
              <Td>{u.role === "admin" ? <StatusChip label="Admin" tone="info" /> : <Mono>{u.role ?? "user"}</Mono>}</Td>
              <Td>{u.emailVerified ? <StatusChip label="Confirmed" tone="success" /> : <StatusChip label="Unconfirmed" tone="neutral" />}</Td>
              <Td>{u.twoFactor ? <StatusChip label="On" tone="success" /> : <Mono>Off</Mono>}</Td>
              <Td title={u.banReason ?? undefined}>{u.banned ? <StatusChip label="Banned" tone="danger" /> : <Mono>Active</Mono>}</Td>
              <Td className="whitespace-nowrap text-on-surface-variant">{formatDate(u.createdAt)}</Td>
            </Tr>
          ))}
          {data.rows.length === 0 && <EmptyRow colSpan={8} title={q ? `No users match “${q}”` : "No users here"} detail="Try another filter or search." />}
        </tbody>
      </DataTable>
    </div>
  );
}
