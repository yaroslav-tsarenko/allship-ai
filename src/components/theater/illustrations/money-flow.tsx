import type { CSSProperties } from "react";
import { ink, line, Spot, type IllustrationProps } from "./base";
import type { FeeAmounts } from "./flow";
import styles from "./money-flow.module.css";

function Text({ x, y, children, tone = "fill-on-surface", size = "text-[12px]", weight = "font-medium" }: { x: number; y: number; children: string; tone?: string; size?: string; weight?: string }) {
  return (
    <text x={x} y={y} textAnchor="middle" className={`${tone} ${size} ${weight} tabular-nums`}>
      {children}
    </text>
  );
}

function Lane({ x, length }: { x: number; length: number }) {
  const travel = { "--travel": `${length - 10}px` } as CSSProperties;
  return (
    <g>
      <path d={`M${x} 78h${length}`} className="stroke-outline" {...line} />
      <path d={`M${x + length - 6} 72l6 6-6 6`} className="stroke-outline" {...line} />
      <circle cx={x + 4} cy="78" r="4" className={`fill-primary ${styles.dot}`} style={travel} />
      <circle cx={x + 4} cy="78" r="4" className={`fill-primary ${styles.dot} ${styles.late}`} style={travel} />
    </g>
  );
}

export function MoneyFlow({ amounts = { bid: "$940", fee: "$94", total: "$1,034", percent: 10 }, ...props }: IllustrationProps & { amounts?: FeeAmounts }) {
  return (
    <Spot viewBox="0 0 420 262" {...props}>
      <rect x="30" y="56" width="68" height="44" rx="5" className="fill-surface-container-highest" />
      <rect x="30" y="56" width="68" height="44" rx="5" className={ink} {...line} />
      <path d="M30 68h68" className="stroke-on-surface" strokeWidth="5" />
      <rect x="38" y="78" width="14" height="10" rx="2" className="fill-tertiary-container stroke-on-surface" strokeWidth="1.5" />
      <path d="M60 90h28" className="stroke-outline" {...line} />
      <Lane x={106} length={70} />
      <path d="M210 40l34 11v24c0 22-15 36-34 44-19-8-34-22-34-44V51z" className="fill-primary-container" />
      <path d="M210 40l34 11v24c0 22-15 36-34 44-19-8-34-22-34-44V51z" className={ink} {...line} />
      <rect x="197" y="70" width="26" height="21" rx="3" className="fill-surface stroke-on-surface" strokeWidth="2" />
      <path d="M202 70v-5a8 8 0 0 1 16 0v5" className={ink} {...line} />
      <circle cx="210" cy="79" r="2.5" className="fill-primary" />
      <path d="M210 81v4" className="stroke-primary" {...line} />
      <Lane x={252} length={68} />
      <path d="M330 62l26-14 26 14z" className="fill-secondary-container" />
      <path d="M330 62l26-14 26 14zM335 66v24M347 66v24M365 66v24M377 66v24M328 96h56" className={ink} {...line} />
      <Text x={64} y={136} tone="fill-on-surface-variant" weight="font-normal">
        You pay
      </Text>
      <Text x={64} y={156} size="text-[16px]">
        {amounts.total}
      </Text>
      <Text x={64} y={174} tone="fill-on-surface-variant" size="text-[11px]" weight="font-normal">
        when you accept
      </Text>
      <Text x={210} y={136} tone="fill-on-surface-variant" weight="font-normal">
        Held in escrow
      </Text>
      <Text x={210} y={156} size="text-[16px]">
        {`${amounts.bid} + ${amounts.fee}`}
      </Text>
      <Text x={210} y={174} tone="fill-on-surface-variant" size="text-[11px]" weight="font-normal">
        {`bid + ${amounts.percent}% fee`}
      </Text>
      <Text x={356} y={136} tone="fill-on-surface-variant" weight="font-normal">
        Carrier gets
      </Text>
      <Text x={356} y={156} size="text-[16px]">
        {amounts.bid}
      </Text>
      <Text x={356} y={174} tone="fill-on-surface-variant" size="text-[11px]" weight="font-normal">
        after delivery
      </Text>
      <path d="M210 184v14" className="stroke-error" {...line} strokeDasharray="2 4" />
      <path d="M194 214H90q-26 0-26-26" className="stroke-error" {...line} strokeDasharray="2 4" />
      <path d="M58 194l6-6 6 6" className="stroke-error" {...line} />
      <path d="M226 214h104q26 0 26-26" className="stroke-error" {...line} strokeDasharray="2 4" />
      <path d="M350 194l6-6 6 6" className="stroke-error" {...line} />
      <circle cx="210" cy="214" r="15" className="fill-error-container stroke-on-surface" strokeWidth="2" />
      <path d="M205 207v14M215 207v14" className="stroke-on-error-container" {...line} strokeWidth="3" />
      <Text x={130} y={208} tone="fill-on-surface-variant" size="text-[11px]" weight="font-normal">
        refund
      </Text>
      <Text x={290} y={208} tone="fill-on-surface-variant" size="text-[11px]" weight="font-normal">
        release
      </Text>
      <Text x={210} y={252} size="text-[11px]">
        Dispute open: payout paused, then release, refund or split
      </Text>
    </Spot>
  );
}
