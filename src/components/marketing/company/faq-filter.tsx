"use client";

import { useId, useState, type ReactNode } from "react";

export function FaqFilter({ target, icon }: { target: string; icon: ReactNode }) {
  const id = useId();
  const [q, setQ] = useState("");
  const [shown, setShown] = useState<number | null>(null);

  const apply = (value: string) => {
    setQ(value);
    const root = document.querySelector<HTMLElement>(target);
    if (!root) return;
    const term = value.trim().toLowerCase();
    let count = 0;
    root.querySelectorAll<HTMLElement>("[data-faq-group]").forEach((group) => {
      let visible = 0;
      group.querySelectorAll<HTMLDetailsElement>("details").forEach((d) => {
        const hit = !term || (d.textContent ?? "").toLowerCase().includes(term);
        d.hidden = !hit;
        if (term && hit) d.open = true;
        if (hit) visible += 1;
      });
      group.hidden = visible === 0;
      count += visible;
    });
    setShown(term ? count : null);
  };

  return (
    <div role="search" className="flex flex-col gap-2">
      <label htmlFor={id} className="sr-only">
        Search questions
      </label>
      <div className="flex h-14 items-center gap-3 rounded-full bg-surface-container-high px-5 focus-within:outline-2 focus-within:outline-primary">
        <span className="text-on-surface-variant">{icon}</span>
        <input
          id={id}
          type="search"
          value={q}
          onChange={(e) => apply(e.target.value)}
          placeholder="Search questions, like escrow or cancel"
          className="h-full min-w-0 flex-1 bg-transparent text-body-lg text-on-surface outline-none placeholder:text-on-surface-variant"
        />
      </div>
      <p aria-live="polite" className="min-h-5 px-5 text-body-sm text-on-surface-variant">
        {shown === null ? "" : shown === 0 ? "No questions match. Try another word or contact us." : `${shown} ${shown === 1 ? "question" : "questions"} match`}
      </p>
    </div>
  );
}
