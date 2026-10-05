import { Fragment } from "react";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import {
  arrowForwardIcon,
  arrowUpwardIcon,
  checkIcon,
  closeIcon,
  eastIcon,
  gavelIcon,
  infoIcon,
  starIcon,
} from "@/components/ui/icons.generated";
import { StatusChip } from "@/components/ui/status-chip";
import { formatUsd } from "@/lib/money";
import { cn } from "@/lib/cn";
import { defineScene } from "../define";
import type { SceneViewProps } from "../types";
import { demoBids, demoLoad } from "./data";
import { AppShell, Caret, SparkGlyph } from "./kit";

type S = {
  open: boolean;
  input: string;
  sent: boolean;
  tools: number;
  answer: string;
  action: boolean;
  opened: boolean;
};

const question = `Compare the bids on ${demoLoad.publicId}`;
const answer = `**Lone Star Auto Haul at $940** looks like the best fit. It has the highest rating (4.9 from 212 reviews) and can pick up on Oct 14, the first day of your window.

**Mesa Auto Logistics** is $75 cheaper at $865, but it has 23 reviews and picks up on Oct 16. **Red River Transport** is fastest (2 days) at $1,010.

If the date matters most, take Lone Star. If price matters most, Mesa.`;

const tools = [`Read load ${demoLoad.publicId}`, "Compared 4 bids"];

function Rich({ text }: { text: string }) {
  return (
    <div className="text-body-lg text-on-surface flex flex-col gap-3">
      {text.split("\n\n").map((para, i) => (
        <p key={i}>
          {para.split("**").map((part, j) =>
            j % 2 === 1 ? (
              <strong key={j} className="font-medium">
                {part}
              </strong>
            ) : (
              <Fragment key={j}>{part}</Fragment>
            ),
          )}
        </p>
      ))}
    </div>
  );
}

function Panel({ s, focus }: { s: S; focus: string | null }) {
  const streaming = s.sent && s.answer.length < answer.length;
  return (
    <div className="bg-surface-container-low flex h-full flex-col">
      <div className="flex h-14 shrink-0 items-center gap-2 pr-2 pl-4">
        <SparkGlyph size={22} className="text-primary" />
        <div className="min-w-0 flex-1">
          <p className="text-title-md text-on-surface truncate">AllShip AI</p>
          {s.sent && (
            <p className="text-body-sm text-on-surface-variant truncate">Bids on {demoLoad.publicId}</p>
          )}
        </div>
        <span className="text-on-surface-variant inline-flex size-10 items-center justify-center rounded-full">
          <Icon icon={closeIcon} />
        </span>
      </div>
      <div data-demo-scroll="assistant" className="min-h-0 flex-1 overflow-hidden px-4">
        {!s.sent ? (
          <div className="flex h-full flex-col justify-end gap-5 pb-4">
            <div>
              <SparkGlyph size={30} className="text-primary mb-3" />
              <p className="text-headline-sm text-on-surface">Hi Emily</p>
              <p className="text-body-lg text-on-surface-variant mt-1">
                Ask about your loads, bids or how something works.
              </p>
            </div>
            <div className="flex flex-col items-start gap-2">
              {["Draft a load for my car", "What does the 10% fee cover?"].map((t) => (
                <span
                  key={t}
                  className="border-outline-variant text-label-lg text-on-surface inline-flex min-h-10 items-center rounded-sm border px-4 py-2 font-medium"
                >
                  {t}
                </span>
              ))}
            </div>
          </div>
        ) : (
          <ol className="flex flex-col gap-6 py-4">
            <li className="animate-message-in flex justify-end pl-10">
              <p className="bg-surface-container-highest text-body-lg text-on-surface rounded-[20px] rounded-br-xs px-4 py-2.5">
                {question}
              </p>
            </li>
            <li className="flex gap-3">
              <SparkGlyph
                size={22}
                className={cn(
                  "text-primary mt-0.5 shrink-0",
                  streaming && "animate-spin [animation-duration:2.4s]",
                )}
              />
              <div className="flex min-w-0 flex-1 flex-col gap-3">
                <ul className="flex flex-col gap-1">
                  {tools.slice(0, s.tools).map((t) => (
                    <li
                      key={t}
                      className="text-body-md text-on-surface-variant animate-message-in flex items-center gap-2"
                    >
                      <Icon icon={checkIcon} size={16} className="text-on-surface-variant/70" />
                      {t}
                    </li>
                  ))}
                </ul>
                {s.tools > 0 && !s.answer && (
                  <p className="text-body-md text-on-surface-variant animate-pulse">Thinking…</p>
                )}
                {s.answer && <Rich text={s.answer} />}
                {s.action && (
                  <Button
                    data-demo="action"
                    variant="tonal"
                    size="sm"
                    className="animate-enter self-start"
                    trailing={<Icon icon={arrowForwardIcon} size={18} />}
                  >
                    Open the bids
                  </Button>
                )}
              </div>
            </li>
          </ol>
        )}
      </div>
      <div className="shrink-0 px-3 pt-2 pb-3">
        <div className="bg-surface-container-highest flex items-end gap-1 rounded-[24px] py-1 pr-1 pl-4">
          <span
            data-demo="composer"
            className={cn(
              "text-body-lg min-h-10 flex-1 truncate py-2",
              s.input ? "text-on-surface" : "text-on-surface-variant",
            )}
          >
            {s.input || (focus === "composer" ? "" : "Ask AllShip AI")}
            {focus === "composer" && <Caret />}
          </span>
          <span
            data-demo="send"
            className={cn(
              "state-layer inline-flex size-10 shrink-0 items-center justify-center rounded-full",
              s.input ? "bg-primary text-on-primary" : "text-on-surface/38",
            )}
          >
            <Icon icon={arrowUpwardIcon} size={20} />
          </span>
        </div>
        <p className="text-body-sm text-on-surface-variant flex items-center gap-1.5 px-2 pt-1.5">
          <Icon icon={infoIcon} size={14} />
          It suggests. You confirm every action.
        </p>
      </div>
    </div>
  );
}

function View({ s, focus }: SceneViewProps<S>) {
  const ordered = [...demoBids].sort((a, b) => a.cents - b.cents);
  return (
    <AppShell
      role="shipper"
      active="loads"
      aside={
        <div
          className={cn(
            "border-outline-variant hidden w-[400px] shrink-0 border-l transition-[margin] duration-500 ease-[cubic-bezier(0.2,0,0,1)] @5xl:block",
            !s.open && "-mr-[400px]",
          )}
        >
          <Panel s={s} focus={focus} />
        </div>
      }
    >
      <div className="h-full overflow-hidden px-4 pb-6 @3xl:pr-8 @3xl:pl-2">
        <div className="pt-2 pb-5 @3xl:pt-4">
          <div className="flex flex-wrap items-baseline gap-x-3">
            <h2 className="text-headline-sm text-on-surface @3xl:text-headline-md">{demoLoad.title}</h2>
            <span className="text-label-lg text-on-surface-variant font-mono">{demoLoad.publicId}</span>
          </div>
          <p className="text-body-lg text-on-surface mt-1 flex items-center gap-1.5">
            {demoLoad.from}
            <Icon icon={eastIcon} size={18} className="text-on-surface-variant" />
            {demoLoad.to}
          </p>
          <div className="mt-3">
            <StatusChip tone="primary" icon={gavelIcon}>
              Open for bids
            </StatusChip>
          </div>
        </div>
        <section className="border-outline-variant rounded-md border">
          <h3 className="text-title-lg text-on-surface px-5 pt-4 pb-3">Bids (4)</h3>
          <ul className="border-outline-variant border-t">
            {ordered.map((b) => (
              <li
                key={b.id}
                className={cn(
                  "border-outline-variant flex items-center justify-between gap-4 border-b px-5 py-4 transition-colors duration-500 last:border-b-0",
                  s.opened &&
                    b.id === "lone-star" &&
                    "bg-primary-container/40 shadow-[inset_4px_0_0_var(--md-primary)]",
                )}
              >
                <span className="min-w-0">
                  <span className="text-title-md text-on-surface block truncate">{b.carrier}</span>
                  <span className="text-body-md text-on-surface-variant mt-0.5 inline-flex items-center gap-1">
                    <Icon icon={starIcon} size={16} filled className="text-warning" />
                    {b.rating.toFixed(1)} · Pickup {b.pickup}
                  </span>
                </span>
                <span className="text-title-lg text-on-surface tabular-nums">{formatUsd(b.cents, true)}</span>
              </li>
            ))}
          </ul>
        </section>
      </div>
      <div
        className={cn(
          "absolute inset-0 z-20 transition-transform duration-500 ease-[cubic-bezier(0.2,0,0,1)] @5xl:hidden",
          s.open ? "translate-y-0" : "translate-y-full",
        )}
      >
        <Panel s={s} focus={focus} />
      </div>
    </AppShell>
  );
}

export const aiAssistant = defineScene<S>({
  id: "aiAssistant",
  title: "Ask AllShip AI",
  summary:
    "The assistant reads a load and its bids, compares them in plain language and links to the next step. It never acts on its own.",
  url: `/app/loads/${demoLoad.publicId}`,
  device: "desktop",
  initial: { open: false, input: "", sent: false, tools: 0, answer: "", action: false, opened: false },
  View,
  script: ({ caption, click, type, set, wait, stream, highlight }) => [
    caption("Ask about your load in plain words"),
    click("assistant-btn", { open: true }),
    wait(400),
    type("composer", question, { key: "input" }),
    click("send", { sent: true, input: "" }),
    caption("It reads the load and every bid"),
    wait(500),
    set({ tools: 1 }),
    wait(700),
    set({ tools: 2 }),
    wait(600),
    caption("A plain-language comparison with a recommendation"),
    stream("answer", answer),
    set({ action: true }),
    wait(500),
    caption("You decide. It only opens the page for you"),
    highlight("action", "Actions open a page or prefill a form. Nothing is accepted or paid without you"),
    click("action", { open: false, opened: true }),
    wait(1500),
  ],
});
