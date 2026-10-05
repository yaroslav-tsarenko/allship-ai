"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Icon } from "@/components/ui/icon";
import { warningIcon } from "@/components/ui/icons.generated";
import { SegmentedButton } from "@/components/ui/segmented-button";
import { TextField } from "@/components/ui/text-field";
import type { PostStatus, PublishIssue } from "./rules";

type Mode = "now" | "schedule";

function toLocalInput(date: Date) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function defaultSchedule() {
  const d = new Date(Date.now() + 24 * 60 * 60 * 1000);
  d.setHours(9, 0, 0, 0);
  return toLocalInput(d);
}

export function PublishDialog({
  open,
  onOpenChange,
  issues,
  status,
  publishedAt,
  onPublish,
  busy,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  issues: PublishIssue[];
  status: PostStatus;
  publishedAt: string | null;
  onPublish: (input: { op: "publish" } | { op: "schedule"; at: string }) => Promise<void>;
  busy: boolean;
}) {
  const live = status === "published" || status === "scheduled";
  const [mode, setMode] = useState<Mode>(live ? "schedule" : "now");
  const [at, setAtValue] = useState(() => (publishedAt ? toLocalInput(new Date(publishedAt)) : defaultSchedule()));
  const [isPast, setIsPast] = useState(() => Boolean(publishedAt && new Date(publishedAt).getTime() <= Date.now()));
  const setAt = (value: string) => {
    setAtValue(value);
    setIsPast(Boolean(value) && new Date(value).getTime() <= Date.now());
  };
  const when = at ? new Date(at) : null;
  const valid = mode === "now" || (when !== null && !Number.isNaN(when.getTime()));
  const past = mode === "schedule" && isPast;
  const zone = Intl.DateTimeFormat().resolvedOptions().timeZone;

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title={live ? "Publish date" : "Publish post"}
      description={issues.length ? "Fix these first. Drafts can stay incomplete, published posts can't." : live ? "Pick a new date. A future date takes the post off the site until then." : "Publish now, or pick a date and time to go live."}
      actions={
        <>
          <Button variant="text" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            disabled={issues.length > 0 || !valid}
            loading={busy}
            onClick={() => void onPublish(mode === "now" ? { op: "publish" } : { op: "schedule", at: new Date(at).toISOString() })}
          >
            {mode === "now" ? "Publish now" : past ? "Publish with this date" : "Schedule"}
          </Button>
        </>
      }
    >
      {issues.length > 0 ? (
        <ul className="flex flex-col gap-2">
          {issues.map((i) => (
            <li key={i.field} className="flex gap-2 text-body-md text-on-surface">
              <Icon icon={warningIcon} size={20} className="shrink-0 text-warning" />
              {i.message}
            </li>
          ))}
        </ul>
      ) : (
        <div className="flex flex-col gap-4">
          {!live && (
            <SegmentedButton
              label="When to publish"
              value={mode}
              onChange={setMode}
              options={[
                { value: "now", label: "Now" },
                { value: "schedule", label: "Pick a date" },
              ]}
            />
          )}
          {mode === "schedule" && (
            <TextField
              label="Date and time"
              type="datetime-local"
              value={at}
              onChange={(e) => setAt(e.target.value)}
              supportingText={past ? "This date is in the past, so the post goes live right away with this date." : `Your time zone: ${zone}`}
            />
          )}
        </div>
      )}
    </Dialog>
  );
}
