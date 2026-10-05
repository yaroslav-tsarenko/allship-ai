import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { addIcon } from "@/components/ui/icons.generated";
import { PageHeader } from "@/components/ui/page-header";
import { DataTable, EmptyRow, Mono, RowLink, Td, Th, Toolbar, Tr } from "@/features/admin/data-table";
import { FilterChips } from "@/features/admin/filter-chips";
import { formatDate, formatDateTime, hrefWith, oneOf, pageParam, param, type SearchParams } from "@/features/admin/format";
import { Pagination } from "@/features/admin/pagination";
import { SearchBox } from "@/features/admin/search-box";
import { PostStatusChip } from "@/features/admin/blog/post-status-chip";
import { listAdminPosts, type AdminPostFilter } from "@/server/blog/admin";
import { requireAdmin } from "@/server/auth/session";

export const metadata: Metadata = { title: "Blog" };

const filters: { value: AdminPostFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "draft", label: "Drafts" },
  { value: "scheduled", label: "Scheduled" },
  { value: "published", label: "Published" },
  { value: "archived", label: "Archived" },
];

export default async function AdminBlogPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  await requireAdmin();
  const sp = await searchParams;
  const filter = oneOf(param(sp, "status"), filters.map((f) => f.value), "all");
  const q = param(sp, "q");
  const category = param(sp, "category");
  const page = pageParam(sp);
  const data = await listAdminPosts({ filter, q, category, page });
  const current = { status: filter === "all" ? undefined : filter, q, category };

  return (
    <div>
      <PageHeader
        title="Blog"
        description={category ? <>Guides in <Mono>{category}</Mono> · <Link href={hrefWith("/admin/blog", current, { category: undefined })} className="text-primary hover:underline">Show all topics</Link></> : "Write, schedule and publish guides for allship.ai/blog."}
        actions={
          <Button asChild>
            <Link href="/admin/blog/new">
              <Icon icon={addIcon} size={18} />
              New post
            </Link>
          </Button>
        }
      />
      <DataTable
        label="Posts"
        minWidth={920}
        toolbar={
          <Toolbar>
            <FilterChips label="Post status" value={filter} options={filters.map((f) => ({ ...f, count: data.counts[f.value] ?? 0, href: hrefWith("/admin/blog", current, { status: f.value === "all" ? undefined : f.value, page: undefined }) }))} />
            <SearchBox action="/admin/blog" label="Search posts" placeholder="Title, URL or excerpt" value={q} keep={{ status: current.status, category }} />
          </Toolbar>
        }
        footer={<Pagination page={data.page} pageCount={data.pageCount} total={data.total} hrefFor={(p) => hrefWith("/admin/blog", current, { page: p > 1 ? String(p) : undefined })} />}
      >
        <thead>
          <tr>
            <Th>Title</Th>
            <Th>Status</Th>
            <Th>Topic</Th>
            <Th>Updated</Th>
            <Th>Published</Th>
            <Th>Author</Th>
          </tr>
        </thead>
        <tbody>
          {data.rows.map((p) => (
            <Tr key={p.id} interactive>
              <Td className="max-w-[380px]">
                <div className="flex items-center gap-4">
                  <div className="relative hidden h-10 w-16 shrink-0 overflow-hidden rounded-xs bg-surface-container-high medium:block">
                    {p.coverKey && <Image src={p.coverKey} alt="" fill sizes="64px" className="object-cover" />}
                  </div>
                  <div className="min-w-0">
                    <RowLink href={`/admin/blog/${p.id}`} className="block truncate">
                      {p.title}
                    </RowLink>
                    <Mono className="block truncate">/blog/{p.slug}</Mono>
                  </div>
                </div>
              </Td>
              <Td>
                <PostStatusChip status={p.status} />
              </Td>
              <Td>
                {p.categorySlug ? (
                  <Link href={hrefWith("/admin/blog", current, { category: p.categorySlug, page: undefined })} className="relative z-10 text-on-surface-variant hover:text-primary hover:underline">
                    {p.categoryName}
                  </Link>
                ) : (
                  <span className="text-on-surface-variant">—</span>
                )}
              </Td>
              <Td className="whitespace-nowrap text-on-surface-variant">{formatDateTime(p.updatedAt)}</Td>
              <Td className="whitespace-nowrap text-on-surface-variant">{p.status === "scheduled" ? formatDateTime(p.publishedAt) : formatDate(p.publishedAt)}</Td>
              <Td className="max-w-[180px] truncate text-on-surface-variant">{p.authorName}</Td>
            </Tr>
          ))}
          {data.rows.length === 0 && (
            <EmptyRow colSpan={6} title={q ? `No posts match “${q}”` : filter === "all" ? "No posts yet" : `No ${filters.find((f) => f.value === filter)?.label.toLowerCase()} right now`} detail="Start a draft with New post. Drafts autosave as you type." />
          )}
        </tbody>
      </DataTable>
    </div>
  );
}
