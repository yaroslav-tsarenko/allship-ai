import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import {
  addIcon,
  arrowBackIcon,
  arrowForwardIcon,
  checkIcon,
  inventory2Icon,
  movingIcon,
} from "@/components/ui/icons.generated";
import { cn } from "@/lib/cn";
import { defineScene } from "../define";
import type { SceneViewProps } from "../types";
import { AiFilledNote, AssistantPanel, DockedAssistant, SheetAssistant } from "./assistant-kit";
import { AppShell, Field, PageTitle } from "./kit";

type S = {
  open: boolean;
  input: string;
  sent: boolean;
  tools: number;
  answer: string;
  card: boolean;
  view: "home" | "form";
};

const question = "Move my 2-bedroom apartment from Austin to Denver, early November";
const tools = ["Matched category: Long-distance moving", "Filled 7 of 9 fields"];
const answer =
  "I started a **long-distance moving** load for you: a 2-bedroom apartment from Austin, TX to Denver, CO, pickup Nov 3 – Nov 7.\n\nCheck the floors and packing before you post. I left the ZIP codes for you to add.";

const steps = ["Category", "Details", "Route", "Review"];

function Stepper() {
  return (
    <ol className="mb-6 hidden items-center @3xl:flex">
      {steps.map((label, i) => {
        const done = i < 1;
        const on = i === 1;
        return (
          <li key={label} className={cn("flex min-w-0 items-center", i < steps.length - 1 && "flex-1")}>
            <span className="flex min-w-0 items-center gap-3 py-1">
              <span
                className={cn(
                  "text-label-lg flex size-8 shrink-0 items-center justify-center rounded-full font-medium",
                  done && "bg-primary text-on-primary",
                  on && "bg-primary-container text-on-primary-container ring-primary ring-2",
                  !done && !on && "border-outline text-on-surface-variant border",
                )}
              >
                {done ? <Icon icon={checkIcon} size={18} /> : i + 1}
              </span>
              <span className={cn("text-label-lg truncate", on ? "text-on-surface" : "text-on-surface-variant")}>{label}</span>
            </span>
            {i < steps.length - 1 && <span className={cn("mx-3 h-px min-w-6 flex-1", done ? "bg-primary" : "bg-outline-variant")} />}
          </li>
        );
      })}
    </ol>
  );
}

function Home() {
  return (
    <div className="pt-2 @3xl:pt-4">
      <PageTitle title="Good morning, Emily" sub="Nothing on the road yet. Post a load to get bids." />
      <div className="border-outline-variant grid grid-cols-3 divide-outline-variant divide-x rounded-md border">
        {[
          ["Active", "0"],
          ["Bids waiting", "0"],
          ["Drafts", "0"],
        ].map(([k, v]) => (
          <div key={k} className="px-4 py-4">
            <p className="text-body-md text-on-surface-variant">{k}</p>
            <p className="text-headline-md text-on-surface mt-1 tabular-nums">{v}</p>
          </div>
        ))}
      </div>
      <div className="mt-6 flex flex-wrap gap-2">
        <Button leading={<Icon icon={addIcon} size={20} />}>Post a load</Button>
        <Button variant="outlined">Instant moving prices</Button>
      </div>
    </div>
  );
}

function Form() {
  return (
    <>
      <PageTitle title="Post a load" />
      <Stepper />
      <AiFilledNote />
      <div className="mt-5 flex items-center gap-3">
        <span className="bg-secondary-container text-on-secondary-container flex size-10 shrink-0 items-center justify-center rounded-sm">
          <Icon icon={movingIcon} />
        </span>
        <div>
          <p className="text-label-md text-on-surface-variant">Category</p>
          <p className="text-title-md text-on-surface">Long-distance moving</p>
        </div>
      </div>
      <section className="mt-6">
        <h3 className="text-title-md text-on-surface">Home</h3>
        <div className="mt-4 grid gap-x-4 gap-y-5 @3xl:grid-cols-2">
          <Field label="Type of home *" value="Apartment" select />
          <Field label="Bedrooms *" value="2" select />
          <Field demo="floor" label="Pickup floor *" value="" select />
          <Field label="Delivery floor *" value="" select />
        </div>
      </section>
      <section className="mt-6">
        <h3 className="text-title-md text-on-surface">Help</h3>
        <div className="mt-4 grid gap-x-4 gap-y-5 @3xl:grid-cols-2">
          <Field label="Packing *" value="I'll pack" select />
          <Field label="Pickup window" value="Nov 3 – Nov 7" />
        </div>
      </section>
      <div className="border-outline-variant mt-8 flex items-center gap-2 border-t py-3">
        <Button variant="text" leading={<Icon icon={arrowBackIcon} size={20} />}>
          Back
        </Button>
        <span className="flex-1" />
        <Button trailing={<Icon icon={arrowForwardIcon} size={20} />}>Continue</Button>
      </div>
    </>
  );
}

function View({ s, focus }: SceneViewProps<S>) {
  const panel = (
    <AssistantPanel
      s={s}
      focus={focus}
      greeting="Hi Emily"
      suggestions={["Draft a load for my move", "How does escrow work?"]}
      question={question}
      tools={tools}
      full={answer}
      subtitle="New load draft"
    >
      {s.card && (
        <div className="border-outline-variant bg-surface animate-enter flex flex-col gap-3 rounded-md border p-4">
          <div className="flex items-start gap-3">
            <span className="bg-secondary-container text-on-secondary-container mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-sm">
              <Icon icon={inventory2Icon} size={20} />
            </span>
            <div className="min-w-0">
              <p className="text-label-md text-on-surface-variant">New load draft</p>
              <p className="text-title-sm text-on-surface">2-bedroom apartment</p>
              <p className="text-body-md text-on-surface-variant">Austin, TX → Denver, CO</p>
            </div>
          </div>
          <Button data-demo="open-form" size="sm" className="self-start" trailing={<Icon icon={arrowForwardIcon} size={18} />}>
            Review the form
          </Button>
        </div>
      )}
    </AssistantPanel>
  );
  return (
    <AppShell role="shipper" active={s.view === "home" ? "home" : "loads"} aside={<DockedAssistant open={s.open} panel={panel} />}>
      <div className="h-full overflow-hidden px-4 pb-6 @3xl:pr-8 @3xl:pl-2">{s.view === "home" ? <Home /> : <Form />}</div>
      <SheetAssistant open={s.open} panel={panel} />
    </AppShell>
  );
}

export const aiDraftLoad = defineScene<S>({
  id: "aiDraftLoad",
  title: "Draft a load from one sentence",
  summary:
    "A shipper describes a move in plain words. The assistant picks the category, fills the form it can and hands it back for review.",
  url: (s) => (s.view === "form" ? "/app/loads/new?prefill=ai" : "/app"),
  device: "desktop",
  initial: { open: false, input: "", sent: false, tools: 0, answer: "", card: false, view: "home" },
  View,
  script: ({ caption, click, type, set, wait, stream, highlight }) => [
    caption("Describe the job the way you'd text a friend"),
    click("assistant-btn", { open: true }),
    wait(300),
    type("composer", question, { key: "input" }),
    click("send", { sent: true, input: "" }),
    caption("It matches one of 23 categories and fills what it can"),
    wait(400),
    set({ tools: 1 }),
    wait(700),
    set({ tools: 2 }),
    wait(400),
    stream("answer", answer),
    set({ card: true }),
    wait(400),
    caption("You get a draft, not a posted load"),
    click("open-form", { open: false, view: "form" }),
    wait(500),
    highlight("ai-note", "Marked as AI-filled. Nothing is posted until you press Post load"),
    highlight("floor", "Fields it couldn't know stay empty for you"),
    wait(1200),
  ],
});
