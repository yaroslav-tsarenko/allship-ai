"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Icon } from "@/components/ui/icon";
import { articleIcon, linkIcon } from "@/components/ui/icons.generated";
import { TextField } from "@/components/ui/text-field";
import { siteLinkTargets } from "./topics";
import type { EditorOptions } from "./types";

type Target = { href: string; label: string; group: string };

export function LinkDialog({
  open,
  onOpenChange,
  options,
  excludeId,
  selectedText,
  onPick,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  options: EditorOptions;
  excludeId: string | null;
  selectedText: () => string;
  onPick: (href: string, label: string) => void;
}) {
  const [query, setQuery] = useState("");
  const [error, setError] = useState<string>();

  const targets = useMemo<Target[]>(
    () => [
      ...options.posts.filter((p) => p.id !== excludeId).map((p) => ({ href: `/blog/${p.slug}`, label: p.title, group: "Guides" })),
      ...options.categories.map((c) => ({ href: `/blog/category/${c.slug}`, label: `${c.name} guides`, group: "Guide topics" })),
      ...siteLinkTargets.map((t) => ({ href: t.href, label: t.label, group: t.group })),
    ],
    [options.posts, options.categories, excludeId],
  );

  const q = query.trim().toLowerCase();
  const isUrl = /^(https?:\/\/|\/|mailto:|tel:)/i.test(query.trim());
  const filtered = isUrl ? [] : targets.filter((t) => !q || t.label.toLowerCase().includes(q) || t.href.includes(q)).slice(0, 40);
  const groups = [...new Set(filtered.map((t) => t.group))];

  const pick = (href: string, label: string) => {
    onOpenChange(false);
    setQuery("");
    setError(undefined);
    onPick(href, selectedText() ? "" : label);
  };

  const submitUrl = () => {
    const v = query.trim();
    if (/^http:\/\//i.test(v)) return setError("Use an https:// link");
    if (!/^(https:\/\/[^\s]+|\/[^\s]*|mailto:[^\s]+|tel:[^\s]+)$/i.test(v)) return setError("Enter a full https:// URL or a path that starts with /");
    pick(v, v.replace(/^https:\/\/(www\.)?/, ""));
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        onOpenChange(o);
        if (!o) {
          setQuery("");
          setError(undefined);
        }
      }}
      title="Insert link"
      description="Search allship.ai pages and guides, or paste a URL."
      className="max-w-[640px]"
      actions={
        <>
          <Button variant="text" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={submitUrl} disabled={!isUrl}>
            Insert URL
          </Button>
        </>
      }
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (isUrl) submitUrl();
          else if (filtered[0]) pick(filtered[0].href, filtered[0].label);
        }}
      >
        <TextField label="Search or paste a URL" value={query} onChange={(e) => (setQuery(e.target.value), setError(undefined))} error={error} autoFocus leading={<Icon icon={linkIcon} size={20} />} />
      </form>
      {!isUrl && (
        <div className="-mx-6 max-h-[45vh] overflow-y-auto border-t border-outline-variant">
          {groups.map((g) => (
            <div key={g} role="group" aria-label={g}>
              <p className="px-6 pt-4 pb-1 text-label-md font-medium text-on-surface-variant">{g}</p>
              <ul>
                {filtered
                  .filter((t) => t.group === g)
                  .map((t) => (
                    <li key={t.href}>
                      <button type="button" onClick={() => pick(t.href, t.label)} className="state-layer flex w-full cursor-pointer items-center gap-3 px-6 py-2.5 text-left">
                        <Icon icon={articleIcon} size={20} className="shrink-0 text-on-surface-variant" />
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-body-lg text-on-surface">{t.label}</span>
                          <span className="block truncate font-mono text-body-sm text-on-surface-variant">{t.href}</span>
                        </span>
                      </button>
                    </li>
                  ))}
              </ul>
            </div>
          ))}
          {filtered.length === 0 && <p className="px-6 py-8 text-center text-body-md text-on-surface-variant">No pages match “{query}”.</p>}
        </div>
      )}
    </Dialog>
  );
}
