import { site } from "@/content/site";
import { cn } from "@/lib/cn";

const usd = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });

export function FeeExample({ bid = 1200, className }: { bid?: number; className?: string }) {
  const fee = Math.round(bid * site.platformFeePercent) / 100;
  const rows = [
    { label: "Your bid", value: bid, note: "The price you enter" },
    { label: `Service fee, ${site.platformFeePercent}%`, value: fee, note: "Added on top, paid by the shipper" },
    { label: "Shipper pays", value: bid + fee, note: "Held in escrow until delivery" },
  ];
  return (
    <figure className={cn("m-0 rounded-xl bg-surface-container-low p-6 medium:p-8", className)}>
      <figcaption className="text-label-lg text-on-surface-variant">Example load, for illustration</figcaption>
      <dl className="mt-6 divide-y divide-outline-variant">
        {rows.map((row) => (
          <div key={row.label} className="flex items-baseline justify-between gap-6 py-4">
            <dt>
              <span className="block text-title-md text-on-surface">{row.label}</span>
              <span className="block text-body-md text-on-surface-variant">{row.note}</span>
            </dt>
            <dd className="font-mono text-title-lg text-on-surface tabular-nums">{usd.format(row.value)}</dd>
          </div>
        ))}
      </dl>
      <div className="mt-2 flex items-baseline justify-between gap-6 rounded-lg bg-success-container px-5 py-5 text-on-success-container">
        <span className="text-title-md">You receive</span>
        <span data-count="" className="font-mono text-headline-md tabular-nums">
          {usd.format(bid)}
        </span>
      </div>
    </figure>
  );
}

const stages = [
  { title: "You bid", body: "Enter your price, an estimated delivery time and a short message to the shipper." },
  { title: "The shipper accepts and pays", body: "Payment is taken at booking and held in escrow through Stripe. The load is now booked to your company." },
  { title: "Your driver delivers", body: "At delivery the driver takes a photo and collects a signature in the app." },
  { title: "The load is confirmed", body: `The shipper confirms delivery, or the load confirms automatically ${site.autoConfirmHours} hours after it is marked delivered.` },
  { title: "Your full bid is transferred", body: "The money goes to your company's Stripe account, and Stripe pays it out to your bank." },
];

export function PayoutTimeline({ className }: { className?: string }) {
  return (
    <ol className={cn("relative", className)}>
      {stages.map((stage, i) => (
        <li key={stage.title} className="relative grid grid-cols-[40px_1fr] gap-4 pb-8 last:pb-0">
          {i < stages.length - 1 && <span aria-hidden="true" className="absolute top-10 bottom-0 left-[19px] w-0.5 bg-outline-variant" />}
          <span
            aria-hidden="true"
            className={cn(
              "relative flex size-10 items-center justify-center rounded-full font-mono text-title-sm",
              i === stages.length - 1 ? "bg-success text-on-success" : "bg-primary-container text-on-primary-container",
            )}
          >
            {i + 1}
          </span>
          <div className="pt-1.5">
            <h3 className="text-title-lg font-normal text-on-surface">{stage.title}</h3>
            <p className="mt-1 max-w-[520px] text-body-lg text-pretty text-on-surface-variant">{stage.body}</p>
          </div>
        </li>
      ))}
    </ol>
  );
}
