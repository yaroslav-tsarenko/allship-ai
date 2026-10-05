"use client";

import Form from "next/form";
import type { FormEvent, ReactNode } from "react";
import { track } from "@/lib/analytics";

export function QuoteFormShell({ source, className, children }: { source: string; className?: string; children: ReactNode }) {
  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    const form = e.currentTarget;
    const category = new FormData(form).get("category");
    track("quote_started", { source, category: typeof category === "string" ? category : "" });
    const blanks = Array.from(form.querySelectorAll<HTMLInputElement | HTMLSelectElement>("input[name],select[name]")).filter((el) => !el.value.trim());
    for (const el of blanks) el.disabled = true;
    window.setTimeout(() => {
      for (const el of blanks) el.disabled = false;
    }, 0);
  };
  return (
    <Form action="/quote" onSubmit={onSubmit} className={className} aria-label="Start a quote">
      {children}
    </Form>
  );
}
