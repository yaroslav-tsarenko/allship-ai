import { ink, line, Spot, type IllustrationProps } from "./base";

function Check({ x, y, r = 7 }: { x: number; y: number; r?: number }) {
  return (
    <g>
      <circle cx={x} cy={y} r={r} className="fill-success-container" />
      <path d={`M${x - r * 0.45} ${y}l${r * 0.3} ${r * 0.32} ${r * 0.6}-${r * 0.68}`} className="stroke-success" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </g>
  );
}

function Label({ x, y, children, anchor, tone = "fill-on-surface", size = "text-[10px]", mono }: { x: number; y: number; children: string; anchor?: "start" | "middle" | "end"; tone?: string; size?: string; mono?: boolean }) {
  return (
    <text x={x} y={y} textAnchor={anchor} className={`${tone} ${size} ${mono ? "font-mono tracking-wider" : "font-medium"} tabular-nums`}>
      {children}
    </text>
  );
}

function Card({ x, y, w, h, tone = "fill-surface-container-high" }: { x: number; y: number; w: number; h: number; tone?: string }) {
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} rx="6" className={tone} />
      <rect x={x} y={y} width={w} height={h} rx="6" className={ink} {...line} />
    </g>
  );
}

function Arrow({ d }: { d: string }) {
  return <path d={d} className="stroke-primary" {...line} strokeDasharray="2 5" />;
}

export function FlowPost(props: IllustrationProps) {
  const checks = ["Active authority", "Allowed to operate", "Legal name matches", "Insurance on file"];
  return (
    <Spot viewBox="0 0 320 200" {...props}>
      <Card x={12} y={26} w={136} h={150} />
      <Label x={24} y={46} mono tone="fill-on-surface-variant" size="text-[9px]">
        AS-1042 · DRAFT
      </Label>
      <circle cx="30" cy="68" r="5" className="fill-surface stroke-primary" strokeWidth="2.5" />
      <path d="M30 74v14" className="stroke-outline" {...line} strokeDasharray="1 4" />
      <path d="M30 104c-2-5-6-7-6-11a6 6 0 0 1 12 0c0 4-4 6-6 11z" className="fill-primary" />
      <path d="M44 68h80M44 96h64" className="stroke-on-surface" {...line} />
      <rect x="24" y="116" width="54" height="22" rx="4" className="fill-surface" />
      <rect x="82" y="116" width="54" height="22" rx="4" className="fill-surface" />
      <path d="M32 127h28M90 127h24" className="stroke-outline" {...line} />
      <rect x="24" y="148" width="112" height="18" rx="9" className="fill-primary" />
      <Label x={80} y={160} anchor="middle" tone="fill-on-primary" size="text-[9px]">
        Post load · free
      </Label>
      <Arrow d="M152 100h20" />
      <Card x={176} y={34} w={132} h={134} tone="fill-surface" />
      <Label x={188} y={54} mono tone="fill-on-surface-variant" size="text-[9px]">
        FMCSA · USDOT
      </Label>
      <path d="M270 50h26" className="stroke-outline" {...line} />
      {checks.map((c, i) => (
        <g key={c}>
          <Check x={196} y={76 + i * 24} />
          <Label x={210} y={79 + i * 24} size="text-[9.5px]">
            {c}
          </Label>
        </g>
      ))}
    </Spot>
  );
}

export type FeeAmounts = { bid: string; fee: string; total: string; percent: number };

const defaultAmounts: FeeAmounts = { bid: "$940", fee: "$94", total: "$1,034", percent: 10 };

export function FlowBook({ amounts = defaultAmounts, ...props }: IllustrationProps & { amounts?: FeeAmounts }) {
  const bids = [
    { y: 52, label: "$1,120", w: 44, pick: false },
    { y: 84, label: amounts.bid, w: 30, pick: true },
    { y: 116, label: "$1,060", w: 38, pick: false },
  ];
  return (
    <Spot viewBox="0 0 320 200" {...props}>
      {bids.map((b) => (
        <g key={b.label}>
          <rect x="12" y={b.y - 14} width="136" height="26" rx="4" className={b.pick ? "fill-primary/15" : "fill-surface-container-high"} />
          <rect x="12" y={b.y - 14} width="136" height="26" rx="4" className={b.pick ? "stroke-primary" : "stroke-outline-variant"} {...line} />
          <circle cx="28" cy={b.y - 1} r="7" className="fill-surface stroke-outline" strokeWidth="1.5" />
          <path d={`M42 ${b.y - 4}h${b.w}`} className="stroke-on-surface" {...line} />
          <path d={`M42 ${b.y + 3}h${b.w - 12}`} className="stroke-outline" {...line} />
          <Label x={140} y={b.y + 3} anchor="end">
            {b.label}
          </Label>
        </g>
      ))}
      <path d="M24 82l3 3 6-6" className="stroke-primary" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Label x={12} y={160} tone="fill-on-surface-variant" size="text-[9px]">
        Bids from verified carriers
      </Label>
      <Arrow d="M152 84h20" />
      <Card x={176} y={26} w={132} h={150} tone="fill-surface" />
      <Label x={188} y={48} tone="fill-on-surface-variant" size="text-[9px]">
        Accepted bid
      </Label>
      <Label x={296} y={48} anchor="end">
        {amounts.bid}
      </Label>
      <Label x={188} y={68} tone="fill-on-surface-variant" size="text-[9px]">
        {`Service fee ${amounts.percent}%`}
      </Label>
      <Label x={296} y={68} anchor="end">
        {amounts.fee}
      </Label>
      <path d="M188 80h108" className="stroke-outline-variant" {...line} />
      <Label x={188} y={98}>
        You pay
      </Label>
      <Label x={296} y={98} anchor="end" size="text-[12px]">
        {amounts.total}
      </Label>
      <rect x="188" y="112" width="108" height="22" rx="11" className="fill-primary" />
      <rect x="204" y="122" width="10" height="8" rx="1.5" className="fill-on-primary" />
      <path d="M206 122v-2.5a3 3 0 0 1 6 0v2.5" className="stroke-on-primary" fill="none" strokeWidth="1.5" />
      <Label x={220} y={127} tone="fill-on-primary" size="text-[9px]">
        Pay into escrow
      </Label>
      <circle cx="198" cy="156" r="8" className="fill-none stroke-outline-variant" strokeWidth="2.5" />
      <path d="M198 148a8 8 0 0 1 8 8" className="stroke-primary" fill="none" strokeWidth="2.5" strokeLinecap="round" />
      <Label x={212} y={159} tone="fill-on-surface-variant" size="text-[9px]">
        30 min to complete
      </Label>
    </Spot>
  );
}

export function FlowRoad(props: IllustrationProps) {
  return (
    <Spot viewBox="0 0 320 200" {...props}>
      <defs>
        <pattern id="flow-road-dots" width="12" height="12" patternUnits="userSpaceOnUse">
          <circle cx="6" cy="6" r="0.9" className="fill-outline-variant" />
        </pattern>
      </defs>
      <rect x="0" y="0" width="320" height="200" fill="url(#flow-road-dots)" />
      <path d="M40 160C80 160 90 110 140 104S220 60 280 44" className="stroke-outline" {...line} strokeWidth="3" strokeDasharray="2 7" />
      <path d="M40 160C80 160 90 110 140 104" className="stroke-primary" fill="none" strokeWidth="4" strokeLinecap="round" />
      <circle cx="40" cy="160" r="7" className="fill-surface stroke-primary" strokeWidth="3" />
      <circle cx="140" cy="104" r="20" className="fill-primary/10" />
      <circle cx="140" cy="104" r="12" className="fill-primary/20" />
      <circle cx="140" cy="104" r="8" className="fill-primary stroke-surface" strokeWidth="2.5" />
      <path d="M140 99l3.5 8-3.5-2-3.5 2z" className="fill-on-primary" />
      <path d="M280 44c-2-6-9-9-9-16a9 9 0 0 1 18 0c0 7-7 10-9 16z" className="fill-tertiary-container" />
      <path d="M280 44c-2-6-9-9-9-16a9 9 0 0 1 18 0c0 7-7 10-9 16z" className={ink} {...line} />
      <circle cx="280" cy="28" r="3.5" className="fill-tertiary" />
      <g>
        <rect x="18" y="80" width="40" height="32" rx="3" className="fill-surface-container-highest" transform="rotate(-6 38 96)" />
        <rect x="18" y="80" width="40" height="32" rx="3" className={ink} {...line} transform="rotate(-6 38 96)" />
        <rect x="44" y="90" width="40" height="32" rx="3" className="fill-secondary-container" />
        <path d="M48 116l10-12 8 8 6-5 8 9z" className="fill-secondary" />
        <circle cx="74" cy="98" r="3" className="fill-surface" />
        <rect x="44" y="90" width="40" height="32" rx="3" className={ink} {...line} />
      </g>
      <path d="M64 126l-14 24" className="stroke-on-surface-variant" {...line} strokeWidth="1.5" strokeDasharray="1 4" />
      <Label x={162} y={136} tone="fill-on-surface-variant" size="text-[9px]">
        Live position
      </Label>
      <path d="M152 124l-6-8" className="stroke-on-surface-variant" {...line} strokeWidth="1.5" />
      <Label x={14} y={186} tone="fill-on-surface-variant" size="text-[9px]">
        Pickup photos
      </Label>
      <Label x={302} y={70} anchor="end" tone="fill-on-surface-variant" size="text-[9px]">
        Delivery
      </Label>
    </Spot>
  );
}

export function FlowPaid({ payout = "$940", hours = 72, ...props }: IllustrationProps & { payout?: string; hours?: number }) {
  return (
    <Spot viewBox="0 0 320 200" {...props}>
      <Card x={12} y={22} w={132} h={156} tone="fill-surface" />
      <Label x={24} y={42} mono tone="fill-on-surface-variant" size="text-[9px]">
        PROOF OF DELIVERY
      </Label>
      <rect x="24" y="52" width="50" height="38" rx="3" className="fill-secondary-container" />
      <rect x="80" y="52" width="52" height="38" rx="3" className="fill-tertiary-container" />
      <path d="M28 86l14-16 10 10 6-6 14 12zM84 86l12-14 10 8 8-6 16 12z" className="fill-on-surface/15" />
      <Label x={24} y={108} tone="fill-on-surface-variant" size="text-[9px]">
        Received by
      </Label>
      <Label x={24} y={122}>
        Dana R.
      </Label>
      <path d="M26 152c6-14 10-14 12-4s6 8 10-6 8-6 8 4 6 6 12-2 8 2 14 0" className="stroke-on-surface" fill="none" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M24 160h108" className="stroke-outline-variant" {...line} />
      <Check x={128} y={124} r={9} />
      <circle cx="194" cy="62" r="26" className="fill-surface-container-high" />
      <circle cx="194" cy="62" r="26" className="fill-none stroke-outline-variant" strokeWidth="4" />
      <path d="M194 36a26 26 0 0 1 24.7 34" className="stroke-primary" fill="none" strokeWidth="4" strokeLinecap="round" />
      <Label x={194} y={66} anchor="middle" size="text-[12px]">
        {`${hours}h`}
      </Label>
      <Label x={194} y={104} anchor="middle" tone="fill-on-surface-variant" size="text-[9px]">
        Confirm or auto
      </Label>
      <Arrow d="M224 62h24" />
      <path d="M258 52l22-12 22 12z" className="fill-primary-container" />
      <path d="M258 52l22-12 22 12zM262 56v20M274 56v20M286 56v20M298 56v20M256 80h48" className={ink} {...line} />
      <Label x={280} y={100} anchor="middle">
        {payout}
      </Label>
      <Label x={280} y={113} anchor="middle" tone="fill-on-surface-variant" size="text-[9px]">
        to the carrier
      </Label>
      <g className="fill-primary">
        {[0, 1, 2, 3, 4].map((i) => (
          <path key={i} transform={`translate(${172 + i * 24} 148)`} d="M8 0l2.4 5 5.6.8-4 3.9.9 5.5L8 12.6 3.1 15.2l.9-5.5-4-3.9 5.6-.8z" />
        ))}
      </g>
      <Label x={172} y={182} tone="fill-on-surface-variant" size="text-[9px]">
        Review the carrier
      </Label>
    </Spot>
  );
}
