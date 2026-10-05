import type { Metadata } from "next";
import { PageHeader } from "@/components/ui/page-header";
import { DataTable, EmptyRow, Mono, Td, Th, Toolbar, Tr } from "@/features/admin/data-table";
import { Panel } from "@/features/admin/detail";
import { FilterChips } from "@/features/admin/filter-chips";
import { formatDateTime, hrefWith, humanize, oneOf, pageParam, param, type SearchParams } from "@/features/admin/format";
import { Pagination } from "@/features/admin/pagination";
import { SearchBox } from "@/features/admin/search-box";
import { StatusChip, toneFor, type Tone } from "@/features/admin/status-chip";
import { requireAdmin } from "@/server/auth/session";
import { enrollmentStatuses, listEnrollments, listSuppressions, recentSends, sequenceFunnels } from "@/server/nurture/admin";
import { sequenceIds, sequences, type SequenceId } from "@/server/nurture/schedule";
import { EnrollmentActions } from "./enrollment-actions";

export const metadata: Metadata = { title: "Emails" };

const statusTone: Record<string, Tone> = { active: "info", completed: "success", stopped: "neutral", unsubscribed: "warning", sent: "success", skipped: "neutral", sending: "warning", failed: "danger" };
const pct = (part: number, whole: number) => (whole > 0 ? `${Math.round((part / whole) * 100)}%` : "—");
const maxSteps = Math.max(...sequenceIds.map((s) => sequences[s].steps.length));

export default async function EmailsPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  await requireAdmin();
  const sp = await searchParams;
  const sequence = oneOf(param(sp, "sequence"), ["all", ...sequenceIds] as const, "all");
  const status = oneOf(param(sp, "status"), ["all", ...enrollmentStatuses] as const, "all");
  const q = param(sp, "q");
  const page = pageParam(sp);
  const current = { sequence: sequence === "all" ? undefined : sequence, status: status === "all" ? undefined : status, q };

  const [funnels, data, sends, suppressions] = await Promise.all([
    sequenceFunnels(),
    listEnrollments({ sequence: sequence === "all" ? undefined : (sequence as SequenceId), status: status === "all" ? undefined : status, q, page }),
    recentSends(30),
    listSuppressions(50),
  ]);

  return (
    <div className="flex flex-col gap-8">
      <PageHeader title="Emails" description="Follow-up sequences, what went out, and who opted out. The cron sends between 8 a.m. and 8 p.m. in the recipient's time zone." />

      <DataTable label="Sequence funnels" minWidth={960}>
        <thead>
          <tr>
            <Th>Sequence</Th>
            <Th>Type</Th>
            <Th numeric>Enrolled</Th>
            <Th numeric>Active</Th>
            {Array.from({ length: maxSteps }, (_, i) => (
              <Th key={i} numeric>
                Step {i + 1}
              </Th>
            ))}
            <Th numeric>Converted</Th>
            <Th numeric>Opted out</Th>
          </tr>
        </thead>
        <tbody>
          {funnels.map((f) => (
            <Tr key={f.sequence}>
              <Td>
                <a href={hrefWith("/admin/emails", {}, { sequence: f.sequence })} className="text-on-surface hover:underline">
                  {f.label}
                </a>
                <span className="block text-body-sm text-on-surface-variant">{sequences[f.sequence].conversions.map(humanize).join(", ").toLowerCase()} counts as converted</span>
              </Td>
              <Td className="capitalize text-on-surface-variant">{sequences[f.sequence].category}</Td>
              <Td numeric>{f.enrolled.toLocaleString("en-US")}</Td>
              <Td numeric>{f.active.toLocaleString("en-US")}</Td>
              {Array.from({ length: maxSteps }, (_, i) => (
                <Td key={i} numeric className={i >= f.steps.length ? "text-on-surface-variant/50" : undefined}>
                  {i < f.steps.length ? (f.steps[i] ?? 0).toLocaleString("en-US") : "·"}
                </Td>
              ))}
              <Td numeric>
                <span className="text-on-surface">{f.converted.toLocaleString("en-US")}</span>
                <span className="ml-2 text-on-surface-variant">{pct(f.converted, f.enrolled)}</span>
              </Td>
              <Td numeric>{f.unsubscribed.toLocaleString("en-US")}</Td>
            </Tr>
          ))}
        </tbody>
      </DataTable>

      <DataTable
        label="Enrollments"
        minWidth={1180}
        toolbar={
          <div className="flex flex-col gap-3">
            <Toolbar>
              <FilterChips
                label="Enrollment status"
                value={status}
                options={["all", ...enrollmentStatuses].map((s) => ({ value: s, label: s === "all" ? "All" : humanize(s), count: data.counts[s] ?? 0, href: hrefWith("/admin/emails", current, { status: s === "all" ? undefined : s, page: undefined }) }))}
              />
              <SearchBox action="/admin/emails" label="Search enrollments" placeholder="Email or load ID" value={q} keep={{ sequence: current.sequence, status: current.status }} />
            </Toolbar>
            <FilterChips
              label="Sequence"
              value={sequence}
              options={["all", ...sequenceIds].map((s) => ({ value: s, label: s === "all" ? "All sequences" : sequences[s as SequenceId].label, href: hrefWith("/admin/emails", current, { sequence: s === "all" ? undefined : s, page: undefined }) }))}
            />
          </div>
        }
        footer={<Pagination page={data.page} pageCount={data.pageCount} total={data.total} hrefFor={(p) => hrefWith("/admin/emails", current, { page: p > 1 ? String(p) : undefined })} />}
      >
        <thead>
          <tr>
            <Th>Recipient</Th>
            <Th>Sequence</Th>
            <Th>Step</Th>
            <Th>Status</Th>
            <Th>Next send</Th>
            <Th>Last sent</Th>
            <Th>Reason</Th>
            <Th>
              <span className="sr-only">Actions</span>
            </Th>
          </tr>
        </thead>
        <tbody>
          {data.rows.map((e) => {
            const def = sequences[e.sequence as SequenceId];
            return (
              <Tr key={e.id}>
                <Td className="max-w-[260px]">
                  <span className="block truncate text-on-surface">{e.email}</span>
                  <span className="block text-body-sm text-on-surface-variant">{e.publicId ? <Mono>{e.publicId}</Mono> : `Enrolled ${formatDateTime(e.createdAt)}`}</span>
                </Td>
                <Td>{def?.label ?? e.sequence}</Td>
                <Td className="whitespace-nowrap font-mono tabular-nums">
                  {Math.min(e.step, def?.steps.length ?? e.step)}/{def?.steps.length ?? "?"}
                </Td>
                <Td>
                  <StatusChip label={humanize(e.status)} tone={statusTone[e.status] ?? toneFor(e.status)} />
                </Td>
                <Td className="whitespace-nowrap text-on-surface-variant">{e.status === "active" ? formatDateTime(e.nextSendAt) : "—"}</Td>
                <Td className="whitespace-nowrap text-on-surface-variant">{formatDateTime(e.lastSentAt)}</Td>
                <Td className="text-on-surface-variant">{e.stopReason ? humanize(e.stopReason) : "—"}</Td>
                <Td className="text-right">
                  <EnrollmentActions id={e.id} status={e.status} email={e.email} />
                </Td>
              </Tr>
            );
          })}
          {data.rows.length === 0 && <EmptyRow colSpan={8} title={q ? `No enrollments match “${q}”` : "No enrollments yet"} detail="Quote forms, published loads, completed deliveries and carrier sign-ups enroll recipients automatically." />}
        </tbody>
      </DataTable>

      <div className="grid gap-4 large:grid-cols-[minmax(0,7fr)_minmax(0,5fr)]">
        <Panel title="Recent sends" description="Last 30 steps processed, newest first. Skipped means the step's condition no longer applied." flush className="self-start">
          {sends.length === 0 ? (
            <p className="px-6 pb-6 text-body-md text-on-surface-variant">Nothing has gone out yet.</p>
          ) : (
            <ul>
              {sends.map((s) => (
                <li key={s.id} className="flex items-start gap-4 border-t border-outline-variant px-6 py-3">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-body-md text-on-surface" title={s.subject}>
                      {s.status === "skipped" ? `Skipped: ${humanize(s.subject).toLowerCase()}` : s.subject}
                    </p>
                    <p className="truncate text-body-sm text-on-surface-variant">
                      {s.email} · {sequences[s.sequence as SequenceId]?.label ?? s.sequence}, step {s.step + 1}
                      {s.error ? ` · ${s.error}` : ""}
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1">
                    <StatusChip label={humanize(s.status)} tone={statusTone[s.status] ?? "neutral"} />
                    <span className="text-body-sm whitespace-nowrap text-on-surface-variant">{formatDateTime(s.createdAt)}</span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel title="Suppressions" description="Unsubscribes stop tips and reminders. Hard bounces stop every email." flush className="self-start">
          {suppressions.suppressed.length === 0 && suppressions.optOuts.length === 0 ? (
            <p className="px-6 pb-6 text-body-md text-on-surface-variant">No one has opted out or bounced.</p>
          ) : (
            <ul>
              {suppressions.suppressed.map((s) => (
                <li key={`s-${s.email}`} className="flex items-center gap-4 border-t border-outline-variant px-6 py-3">
                  <span className="min-w-0 flex-1 truncate text-body-md text-on-surface">{s.email}</span>
                  <span className="text-body-sm whitespace-nowrap text-on-surface-variant">{s.scope === "all" ? "All email" : "Marketing"}</span>
                  <StatusChip label={humanize(s.reason)} tone={s.reason === "unsubscribed" ? "warning" : "danger"} />
                </li>
              ))}
              {suppressions.optOuts.map((o) => (
                <li key={`o-${o.email}-${o.sequence}`} className="flex items-center gap-4 border-t border-outline-variant px-6 py-3">
                  <span className="min-w-0 flex-1 truncate text-body-md text-on-surface">{o.email}</span>
                  <span className="text-body-sm whitespace-nowrap text-on-surface-variant">{sequences[o.sequence as SequenceId]?.label ?? o.sequence} only</span>
                  <StatusChip label="Opted out" tone="neutral" />
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>
    </div>
  );
}
