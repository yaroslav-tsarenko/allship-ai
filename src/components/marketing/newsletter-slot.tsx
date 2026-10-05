"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

type FormModule = typeof import("./newsletter-form");
type Live = { Form: FormModule["NewsletterForm"]; email: string; focus: boolean };

const loadForm = () => import("./newsletter-form");

export function NewsletterSlot({ doneIcon, children }: { doneIcon: ReactNode; children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const [live, setLive] = useState<Live | null>(null);

  const activate = (focus: boolean) => {
    if (live) return;
    void loadForm().then((m) => {
      const input = ref.current?.querySelector("input");
      setLive((l) => l ?? { Form: m.NewsletterForm, email: input?.value ?? "", focus: focus || document.activeElement === input });
    });
  };

  useEffect(() => {
    const target = ref.current?.firstElementChild;
    if (!target || live) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (!entries.some((e) => e.isIntersecting)) return;
        io.disconnect();
        activate(false);
      },
      { rootMargin: "400px 0px" },
    );
    io.observe(target);
    return () => io.disconnect();
  });

  return (
    <div
      ref={ref}
      className="contents"
      onFocusCapture={() => activate(true)}
      onPointerEnter={() => activate(false)}
      onSubmitCapture={(e) => {
        if (live) return;
        e.preventDefault();
        activate(true);
      }}
    >
      {live ? <live.Form initialEmail={live.email} autoFocus={live.focus} doneIcon={doneIcon} /> : children}
    </div>
  );
}
