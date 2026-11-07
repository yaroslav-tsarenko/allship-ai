import { ink, line, Spot, type IllustrationProps } from "./base";

const slips = [
  { x: 14, y: 22, w: 58, label: "$1,450", tone: "fill-surface-container-highest" },
  { x: 104, y: 14, w: 62, label: "Call back?", tone: "fill-surface-container-highest" },
  { x: 8, y: 146, w: 72, label: "Deposit $300", tone: "fill-error-container" },
  { x: 104, y: 150, w: 66, label: "No USDOT", tone: "fill-error-container" },
  { x: 118, y: 82, w: 46, label: "$780", tone: "fill-surface-container-highest" },
];

const bids = [
  { y: 74, w: 40, label: "$1,120", pick: false },
  { y: 102, w: 34, label: "$940", pick: true },
  { y: 130, w: 36, label: "$1,060", pick: false },
];

export function ProblemsSplit(props: IllustrationProps) {
  return (
    <Spot viewBox="0 0 360 200" {...props}>
      <path d="M180 12v176" className="stroke-outline-variant" {...line} strokeDasharray="2 6" />
      <g className="stroke-on-surface-variant/50" fill="none" strokeWidth="1.5" strokeDasharray="3 4" strokeLinecap="round">
        <path d="M66 96C50 80 70 50 43 34" />
        <path d="M70 92c20-30 40-10 64-62" />
        <path d="M60 108c-30 10-10 26-16 40" />
        <path d="M74 106c34 4 20 40 66 46" />
        <path d="M76 100c20-6 30 8 42-4" />
      </g>
      <circle cx="66" cy="92" r="9" className="fill-surface stroke-on-surface" strokeWidth="2" />
      <path d="M50 120c2-10 8-16 16-16s14 6 16 16" className="fill-surface-container-high stroke-on-surface" strokeWidth="2" strokeLinejoin="round" />
      {slips.map((s) => (
        <g key={s.label}>
          <rect x={s.x} y={s.y} width={s.w} height="20" rx="3" className={s.tone} />
          <rect x={s.x} y={s.y} width={s.w} height="20" rx="3" className={ink} {...line} strokeWidth="1.5" />
          <text x={s.x + 7} y={s.y + 14} className="fill-on-surface text-[10px] font-medium">
            {s.label}
          </text>
        </g>
      ))}
      <rect x="208" y="34" width="132" height="128" rx="6" className="fill-surface-container-high" />
      <rect x="208" y="34" width="132" height="128" rx="6" className={ink} {...line} />
      <text x="220" y="54" className="fill-on-surface-variant font-mono text-[9px] tracking-wider">
        AS-1042
      </text>
      <path d="M296 50h32" className="stroke-outline" {...line} />
      {bids.map((b) => (
        <g key={b.label}>
          <rect x="216" y={b.y - 12} width="116" height="22" rx="4" className={b.pick ? "fill-primary/15" : "fill-surface"} />
          {b.pick && <rect x="216" y={b.y - 12} width="116" height="22" rx="4" className="stroke-primary" {...line} />}
          <circle cx="228" cy={b.y - 1} r="5" className={b.pick ? "fill-primary" : "fill-surface stroke-outline"} strokeWidth="1.5" />
          <path d={`M240 ${b.y - 1}h${b.w}`} className="stroke-outline" {...line} />
          <text x="326" y={b.y + 3} textAnchor="end" className="fill-on-surface text-[10px] font-medium tabular-nums">
            {b.label}
          </text>
        </g>
      ))}
      <circle cx="334" cy="158" r="14" className="fill-success-container stroke-on-surface" strokeWidth="2" />
      <path d="M327 158l5 5 9-10" className="stroke-success" fill="none" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      <text x="90" y="194" textAnchor="middle" className="fill-on-surface-variant text-[10px]">
        Calling around
      </text>
      <text x="274" y="194" textAnchor="middle" className="fill-on-surface-variant text-[10px]">
        One posted load
      </text>
    </Spot>
  );
}
