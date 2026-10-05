import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import {
  calendarMonthIcon,
  checkIcon,
  locationOnIcon,
  mailIcon,
  searchIcon,
  starIcon,
  swapHorizIcon,
  tripOriginIcon,
  verifiedIcon,
} from "@/components/ui/icons.generated";
import { formatUsd } from "@/lib/money";
import { cn } from "@/lib/cn";
import { defineScene } from "../define";
import type { SceneViewProps } from "../types";
import { Field, LogoMark, Sheet } from "./kit";

type S = {
  from: string;
  to: string;
  bedrooms: string;
  date: string;
  packing: number;
  searching: boolean;
  results: boolean;
  breakdown: boolean;
  dialog: "none" | "confirm" | "contact" | "sent";
  email: string;
};

const packing = ["None", "25%", "50%", "100%"];

type Mover = {
  name: string;
  rating: number;
  reviews: number;
  years: number;
  label?: "Lowest price" | "Top rated";
  lines: { label: string; detail: string; cents: number }[];
  carrier: number;
};

const movers: Mover[] = [
  {
    name: "Hill Country Movers",
    rating: 4.8,
    reviews: 64,
    years: 9,
    label: "Lowest price",
    lines: [
      { label: "Transport", detail: "950 ft³ × $1.10 for 901–1,200 miles", cents: 104_500 },
      { label: "Packing (50%)", detail: "475 ft³ × $0.80", cents: 38_000 },
    ],
    carrier: 142_500,
  },
  {
    name: "Mile High Moving Co.",
    rating: 4.9,
    reviews: 118,
    years: 14,
    label: "Top rated",
    lines: [],
    carrier: 156_000,
  },
  { name: "Lone Star Relocation", rating: 4.6, reviews: 31, years: 6, lines: [], carrier: 161_000 },
];

const fee = (c: number) => Math.round(c / 10);
const first = movers[0]!;

function Breakdown({ m }: { m: Mover }) {
  return (
    <dl className="text-body-md flex flex-col gap-2">
      {m.lines.map((l) => (
        <div key={l.label} className="grid grid-cols-[minmax(0,1fr)_auto] gap-x-4">
          <dt className="text-on-surface">{l.label}</dt>
          <dd className="text-on-surface text-right tabular-nums">{formatUsd(l.cents)}</dd>
          <dd className="text-body-sm text-on-surface-variant col-span-2">{l.detail}</dd>
        </div>
      ))}
      <div className="border-outline-variant mt-1 flex justify-between gap-4 border-t pt-2">
        <dt className="text-on-surface-variant">Mover&rsquo;s price</dt>
        <dd className="text-on-surface tabular-nums">{formatUsd(m.carrier)}</dd>
      </div>
      <div className="flex justify-between gap-4">
        <dt className="text-on-surface-variant">AllShip service fee (10%)</dt>
        <dd className="text-on-surface tabular-nums">{formatUsd(fee(m.carrier))}</dd>
      </div>
      <div className="border-outline-variant flex justify-between gap-4 border-t pt-2">
        <dt className="text-title-sm text-on-surface">Total</dt>
        <dd className="text-title-md text-on-surface tabular-nums">
          {formatUsd(m.carrier + fee(m.carrier))}
        </dd>
      </div>
    </dl>
  );
}

function Row({ m, i, open }: { m: Mover; i: number; open: boolean }) {
  const initials = m.name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("");
  return (
    <li
      className="border-outline-variant animate-enter grid gap-x-6 gap-y-3 border-b py-5 last:border-b-0 @3xl:grid-cols-[56px_minmax(0,1fr)_auto]"
      style={{ animationDelay: `${i * 90}ms` }}
    >
      <span
        className={cn(
          "text-title-md hidden size-14 items-center justify-center rounded-md @3xl:flex",
          i === 0 ? "bg-primary text-on-primary" : "bg-secondary-container text-on-secondary-container",
        )}
      >
        {initials}
      </span>
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <h3 className="text-title-lg text-on-surface">{m.name}</h3>
          {m.label && (
            <span
              className={cn(
                "text-label-md rounded-xs px-2 py-0.5",
                m.label === "Lowest price"
                  ? "bg-primary-container text-on-primary-container"
                  : "bg-tertiary-container text-on-tertiary-container",
              )}
            >
              {m.label}
            </span>
          )}
        </div>
        <p className="text-body-md text-on-surface-variant mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1">
          <span className="inline-flex items-center gap-1">
            <Icon icon={starIcon} size={16} filled className="text-warning" />
            <span className="text-on-surface tabular-nums">{m.rating.toFixed(1)}</span>· {m.reviews} reviews
          </span>
          <span className="text-on-surface inline-flex items-center gap-1">
            <Icon icon={verifiedIcon} size={16} filled className="text-success" />
            FMCSA verified
          </span>
          <span className="hidden @3xl:inline">{m.years} years in business</span>
        </p>
        {i === 0 && (
          <>
            <span
              data-demo="see-breakdown"
              className="text-label-lg text-primary mt-3 inline-block font-medium"
            >
              {open ? "Hide price breakdown" : "See price breakdown"}
            </span>
            {open && (
              <div
                data-demo="breakdown"
                className="bg-surface-container-low animate-message-in mt-3 max-w-[520px] rounded-md p-4"
              >
                <Breakdown m={m} />
              </div>
            )}
          </>
        )}
      </div>
      <div className="flex items-center justify-between gap-4 @3xl:flex-col @3xl:items-end">
        <p className="@3xl:text-right">
          <span className="text-headline-sm text-on-surface block tabular-nums">
            {formatUsd(m.carrier + fee(m.carrier))}
          </span>
          <span className="text-body-sm text-on-surface-variant block">total with 10% fee</span>
        </p>
        <Button data-demo={i === 0 ? "choose" : undefined} variant={i === 0 ? "filled" : "tonal"}>
          Choose
        </Button>
      </div>
    </li>
  );
}

function View({ s, focus }: SceneViewProps<S>) {
  return (
    <div className="bg-surface-container-low text-on-surface flex h-full flex-col">
      <div className="bg-surface flex h-14 shrink-0 items-center gap-3 px-4 @3xl:h-16 @3xl:px-8">
        <LogoMark height={22} />
        <span className="flex-1" />
        <span className="text-label-lg text-on-surface-variant hidden @3xl:inline">For carriers</span>
        <Button variant="text" size="sm">
          Sign in
        </Button>
      </div>
      <div data-demo-scroll="page" className="min-h-0 flex-1 overflow-hidden px-4 pb-8 @3xl:px-8">
        <div className="mx-auto max-w-[1040px]">
          <div className="py-5 @3xl:py-7">
            <h2 className="text-headline-md text-on-surface @3xl:text-display-sm">
              Moving quotes in seconds
            </h2>
            <p className="text-body-lg text-on-surface-variant mt-2 max-w-[60ch]">
              Prices come from each mover&rsquo;s published rates. No sign-up to see them.
            </p>
          </div>
          <section className="bg-surface shadow-elevation-1 flex flex-col gap-5 rounded-xl p-5 @3xl:p-7">
            <div className="grid gap-4 @3xl:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] @3xl:items-center">
              <Field
                demo="from"
                label="Moving from *"
                value={s.from}
                focused={focus === "from"}
                leading={<Icon icon={tripOriginIcon} size={20} />}
              />
              <span className="text-on-surface-variant hidden size-12 items-center justify-center @3xl:inline-flex">
                <Icon icon={swapHorizIcon} />
              </span>
              <Field
                demo="to"
                label="Moving to *"
                value={s.to}
                focused={focus === "to"}
                leading={<Icon icon={locationOnIcon} size={20} />}
              />
            </div>
            <div className="grid gap-4 @3xl:grid-cols-3">
              <Field label="Type of home" value="Apartment" select />
              <Field demo="bedrooms" label="Bedrooms" value={s.bedrooms} select />
              <Field
                demo="date"
                label="Pickup date *"
                value={s.date}
                trailing={<Icon icon={calendarMonthIcon} size={20} />}
              />
            </div>
            <fieldset>
              <legend className="text-title-sm text-on-surface mb-3">How much should the crew pack?</legend>
              <div className="border-outline relative grid grid-cols-4 overflow-hidden rounded-full border">
                <span
                  className="bg-secondary-container pointer-events-none absolute inset-y-0 left-0 w-1/4 transition-transform duration-300 ease-[cubic-bezier(0.2,0,0,1)]"
                  style={{ transform: `translateX(${s.packing * 100}%)` }}
                />
                {packing.map((p, i) => (
                  <span
                    key={p}
                    data-demo={`pack-${i}`}
                    className={cn(
                      "state-layer text-label-lg relative flex h-12 items-center justify-center gap-2 font-medium",
                      i > 0 && "border-outline border-l",
                      i === s.packing ? "text-on-secondary-container" : "text-on-surface",
                    )}
                  >
                    {i === s.packing && <Icon icon={checkIcon} size={18} />}
                    {p}
                  </span>
                ))}
              </div>
            </fieldset>
            <div className="border-outline-variant flex flex-col-reverse gap-4 border-t pt-5 @3xl:flex-row @3xl:items-center @3xl:justify-between">
              <p className="text-body-md text-on-surface-variant">
                Your payment is held in escrow until delivery.
              </p>
              <Button
                data-demo="search"
                size="lg"
                loading={s.searching}
                leading={<Icon icon={searchIcon} size={22} />}
                className="@3xl:min-w-[220px]"
              >
                Search movers
              </Button>
            </div>
          </section>
          {s.results && (
            <section
              data-demo="results"
              className="bg-surface-container-lowest shadow-elevation-1 mt-6 rounded-xl p-5 @3xl:p-7"
            >
              <div className="border-outline-variant border-b pb-4">
                <h2 className="text-headline-sm text-on-surface">3 movers can price your move now</h2>
                <p className="text-body-lg text-on-surface-variant mt-2">
                  {s.from} → {s.to}
                </p>
                <p className="text-body-md text-on-surface-variant mt-1">
                  920 road miles · 950 ft³ · long-distance move
                </p>
              </div>
              <ul className="mt-1">
                {movers.map((m, i) => (
                  <Row key={m.name} m={m} i={i} open={s.breakdown} />
                ))}
              </ul>
            </section>
          )}
        </div>
      </div>
      <Sheet
        open={s.dialog === "confirm"}
        title={`Choose ${first.name}?`}
        description={`By choosing ${first.name}, you send them a booking request at this price. Your move is also posted so other verified movers can bid. You pay only when you accept.`}
        actions={
          <>
            <Button variant="text">Cancel</Button>
            <Button data-demo="yes-choose">Yes, choose</Button>
          </>
        }
      />
      <Sheet
        open={s.dialog === "contact"}
        title="Where should we send your booking?"
        description="We create your AllShip account with these details. One click in the email confirms it and sends your booking request."
        actions={
          <>
            <Button variant="text">Back</Button>
            <Button data-demo="book">Book with {first.name}</Button>
          </>
        }
      >
        <div className="flex flex-col gap-4 pt-1">
          <Field label="Name" value="Emily Carter" />
          <Field demo="email" label="Email" value={s.email} focused={focus === "email"} />
        </div>
      </Sheet>
      <Sheet open={s.dialog === "sent"} title="Confirm your email to book">
        <div className="bg-surface-container flex items-start gap-3 rounded-md p-4">
          <Icon icon={mailIcon} className="text-primary mt-0.5 shrink-0" />
          <p className="text-body-md text-on-surface">
            We sent a link to <span className="font-medium">{s.email}</span>. Click it to send your request to{" "}
            {first.name} at {formatUsd(first.carrier + fee(first.carrier))}.
          </p>
        </div>
      </Sheet>
    </div>
  );
}

export const instantQuote = defineScene<S>({
  id: "instantQuote",
  title: "Instant moving quotes",
  summary:
    "A move from Austin to Denver is priced instantly from movers' published rates, compared with the fee included, then booked.",
  url: "/moving",
  device: "desktop",
  initial: {
    from: "",
    to: "",
    bedrooms: "2 bedrooms · 600 ft³",
    date: "",
    packing: 0,
    searching: false,
    results: false,
    breakdown: false,
    dialog: "none",
    email: "",
  },
  View,
  script: ({ caption, click, type, set, wait, scroll, highlight }) => [
    caption("Enter where you're moving from and to"),
    type("from", "Austin, TX"),
    type("to", "Denver, CO"),
    click("bedrooms", { bedrooms: "3 bedrooms · 950 ft³" }),
    click("date", { date: "11/02/2026" }),
    click("pack-2", { packing: 2 }),
    click("search", { searching: true }),
    wait(800),
    set({ searching: false, results: true }),
    caption("Movers' published rates price it instantly"),
    scroll("page", "results", { ms: 800 }),
    wait(600),
    caption("Every line of the price, fee included"),
    click("see-breakdown", { breakdown: true }),
    highlight(
      "breakdown",
      "The mover's own rate per cubic foot, plus the services you picked and the 10% fee",
    ),
    caption("Choose a mover and send a booking request"),
    click("choose", { dialog: "confirm" }),
    click("yes-choose", { dialog: "contact" }),
    type("email", "emily.c@example.com"),
    click("book", { dialog: "sent" }),
    wait(2000),
  ],
});
