import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { arrowForwardIcon, eastIcon, gavelIcon, timerIcon } from "@/components/ui/icons.generated";
import { formatUsd } from "@/lib/money";
import { cn } from "@/lib/cn";
import { defineScene } from "../define";
import type { SceneViewProps } from "../types";
import { AssistantPanel, DockedAssistant, SheetAssistant } from "./assistant-kit";
import { AppShell, Field, SparkGlyph } from "./kit";

type S = {
  open: boolean;
  input: string;
  sent: boolean;
  tools: number;
  answer: string;
  card: boolean;
  filled: boolean;
  amount: string;
};

const loadId = "AS-4M8TQ2";
const question = `Draft a bid on ${loadId}`;
const tools = [`Read load ${loadId}`, "Counted 3 competing bids"];
const answer =
  "Here's a draft. I used the shipper's **$1,200 target** as a starting point. Three carriers have bid so far.\n\nAdjust the price to your costs before you place it.";
const message =
  "Our 2-car wedge is in Houston on Oct 15 and runs to Phoenix the same week. Fully insured, FMCSA verified. We'll confirm the pickup time by chat after booking.";

function Draft({ s }: { s: S }) {
  if (!s.card) return null;
  return (
    <div className="border-outline-variant bg-surface animate-enter flex flex-col gap-3 rounded-md border p-4">
      <div className="flex items-start gap-3">
        <span className="bg-secondary-container text-on-secondary-container mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-sm">
          <Icon icon={gavelIcon} size={20} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-label-md text-on-surface-variant">Bid draft on {loadId}</p>
          <p className="text-title-md text-on-surface tabular-nums">
            {formatUsd(120_000)} <span className="text-body-md text-on-surface-variant">you receive</span>
          </p>
          <p className="text-body-md text-on-surface-variant mt-1 line-clamp-3">{message}</p>
        </div>
      </div>
      <Button data-demo="use-draft" size="sm" className="self-start" trailing={<Icon icon={arrowForwardIcon} size={18} />}>
        Use this draft
      </Button>
    </div>
  );
}

function Detail({ s, focus }: { s: S; focus: string | null }) {
  const cents = Number(s.amount) > 0 ? Number(s.amount) * 100 : 0;
  return (
    <div className="grid gap-6 pt-2 @3xl:pt-4 @6xl:grid-cols-[minmax(0,1fr)_380px]">
      <div className="min-w-0">
        <p className="text-label-md text-on-surface-variant flex items-center gap-2">
          Car or light truck · {loadId}
          <span className="text-on-surface-variant ml-auto inline-flex items-center gap-1">
            <Icon icon={timerIcon} size={16} />
            1d 6h left
          </span>
        </p>
        <h2 className="text-headline-sm text-on-surface mt-1">2019 Ford F-150</h2>
        <p className="text-body-lg text-on-surface mt-1 flex items-center gap-1.5">
          Houston, TX
          <Icon icon={eastIcon} size={18} className="text-on-surface-variant" />
          Phoenix, AZ
          <span className="text-body-md text-on-surface-variant ml-1">1,176 mi</span>
        </p>
        <dl className="divide-outline-variant border-outline-variant mt-5 divide-y border-y">
          {[
            ["Pickup", "Oct 15 – Oct 17"],
            ["Condition", "Runs and drives"],
            ["Trailer", "Open trailer"],
            ["Shipper target", "$1,200"],
            ["Bids so far", "3"],
          ].map(([k, v]) => (
            <div key={k} className="text-body-md grid grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)] gap-4 py-2.5">
              <dt className="text-on-surface-variant">{k}</dt>
              <dd className="text-on-surface">{v}</dd>
            </div>
          ))}
        </dl>
      </div>
      <div data-demo="bid-panel" className="border-outline-variant rounded-md border p-5">
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-title-lg text-on-surface">Place a bid</h3>
            {s.filled && (
              <span className="text-label-md text-primary animate-enter inline-flex items-center gap-1 font-medium">
                <SparkGlyph size={16} />
                AI draft
              </span>
            )}
          </div>
          <Field
            demo="amount"
            label="Your price"
            value={s.amount}
            focused={focus === "amount"}
            leading={<span className="text-body-lg">$</span>}
          />
          <div className="bg-surface-container-low text-body-md flex items-baseline justify-between gap-3 rounded-sm px-4 py-3">
            <span className="text-on-surface-variant">You receive</span>
            <span className="text-title-md text-on-surface tabular-nums">
              {formatUsd(cents)} <span className="text-body-sm text-on-surface-variant">100%</span>
            </span>
          </div>
          <div
            className={cn(
              "border-outline text-body-md min-h-[96px] rounded-xs border px-4 py-3 transition-colors",
              s.filled ? "text-on-surface" : "text-on-surface-variant",
            )}
          >
            {s.filled ? message : "Message to the shipper"}
          </div>
          <Button data-demo="place-bid" size="lg" disabled={!s.filled}>
            Place bid
          </Button>
        </div>
      </div>
    </div>
  );
}

function View({ s, focus }: SceneViewProps<S>) {
  const panel = (
    <AssistantPanel
      s={s}
      focus={focus}
      greeting="Hi Rita"
      suggestions={["Which loads fit my lanes?", "Draft a bid on this load"]}
      question={question}
      tools={tools}
      full={answer}
      subtitle={`Bid on ${loadId}`}
    >
      <Draft s={s} />
    </AssistantPanel>
  );
  return (
    <AppShell role="owner" active="find" user="Rita M." aside={<DockedAssistant open={s.open} panel={panel} />}>
      <div className="h-full overflow-hidden px-4 pb-6 @3xl:pr-8 @3xl:pl-2">
        <Detail s={s} focus={focus} />
      </div>
      <SheetAssistant open={s.open} panel={panel} />
    </AppShell>
  );
}

export const aiDraftBid = defineScene<S>({
  id: "aiDraftBid",
  title: "Draft a bid with AI",
  summary:
    "A carrier asks the assistant to draft a bid. It reads the load and the competition, writes a specific message and fills the bid form for the carrier to edit and place.",
  url: `/app/board/${loadId}`,
  device: "desktop",
  initial: { open: false, input: "", sent: false, tools: 0, answer: "", card: false, filled: false, amount: "" },
  View,
  script: ({ caption, click, type, set, wait, stream, highlight }) => [
    caption("Open a load and ask for a bid draft"),
    click("assistant-btn", { open: true }),
    wait(300),
    type("composer", question, { key: "input" }),
    click("send", { sent: true, input: "" }),
    caption("It reads the load, the target and how many carriers bid"),
    wait(400),
    set({ tools: 1 }),
    wait(700),
    set({ tools: 2 }),
    wait(400),
    stream("answer", answer),
    set({ card: true }),
    wait(500),
    caption("The draft lands in the bid form, not on the shipper's screen"),
    click("use-draft", { open: false, filled: true, amount: "1200" }),
    wait(400),
    caption("Set your own price. You place the bid"),
    click("amount", { amount: "" }),
    type("amount", "1150"),
    highlight("place-bid", "Nothing is sent until you press Place bid"),
    wait(1200),
  ],
});
