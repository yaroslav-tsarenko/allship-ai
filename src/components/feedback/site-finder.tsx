"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useId, useMemo, useState } from "react";
import { Icon } from "@/components/ui/icon";
import { arrowForwardIcon, searchIcon } from "@/components/ui/icons.generated";

export type FinderEntry = { label: string; href: string; group: string };

const normalize = (s: string) => s.toLowerCase().normalize("NFKD").replace(/[^a-z0-9 ]/g, " ");

export function SiteFinder({ entries }: { entries: FinderEntry[] }) {
  const router = useRouter();
  const id = useId();
  const [query, setQuery] = useState("");
  const terms = normalize(query).split(/\s+/).filter(Boolean);
  const results = useMemo(() => {
    if (!terms.length) return [];
    return entries.filter((e) => {
      const hay = normalize(`${e.label} ${e.group} ${e.href.replace(/[/-]/g, " ")}`);
      return terms.every((t) => hay.includes(t));
    }).slice(0, 8);
  }, [entries, terms]);

  return (
    <form
      role="search"
      onSubmit={(e) => {
        e.preventDefault();
        if (results[0]) router.push(results[0].href);
      }}
    >
      <label htmlFor={`${id}-q`} className="text-label-lg text-on-surface-variant">
        Search the site
      </label>
      <div className="mt-2 flex h-14 items-center gap-3 rounded-xs border border-outline px-4 focus-within:border-2 focus-within:border-primary focus-within:px-[15px]">
        <Icon icon={searchIcon} size={20} className="text-on-surface-variant" />
        <input
          id={`${id}-q`}
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Car shipping, moving cost, carrier requirements…"
          autoComplete="off"
          aria-controls={`${id}-results`}
          className="h-full flex-1 bg-transparent text-body-lg text-on-surface outline-none placeholder:text-on-surface-variant/70"
        />
      </div>
      <p className="sr-only" aria-live="polite">
        {terms.length ? `${results.length} ${results.length === 1 ? "match" : "matches"}` : ""}
      </p>
      {terms.length > 0 && (
        <ul id={`${id}-results`} className="mt-2 divide-y divide-outline-variant border-b border-outline-variant">
          {results.length === 0 ? (
            <li className="py-3 text-body-md text-on-surface-variant">No pages match “{query.trim()}”. Try a service like “boat” or “freight”.</li>
          ) : (
            results.map((r) => (
              <li key={r.href}>
                <Link href={r.href} className="state-layer flex items-center gap-3 py-3 pr-2">
                  <span className="flex-1">
                    <span className="block text-body-lg text-on-surface">{r.label}</span>
                    <span className="block text-body-sm text-on-surface-variant">{r.group}</span>
                  </span>
                  <Icon icon={arrowForwardIcon} size={18} className="text-on-surface-variant" />
                </Link>
              </li>
            ))
          )}
        </ul>
      )}
    </form>
  );
}
