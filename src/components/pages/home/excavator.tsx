import { ink, line, Spot, type IllustrationProps } from "@/components/theater/illustrations/base";

export function Excavator(props: IllustrationProps) {
  return (
    <Spot {...props}>
      <path d="M8 104h144" className="stroke-outline-variant" {...line} />
      <rect x="22" y="84" width="76" height="16" rx="8" className="fill-surface-container-highest" />
      <rect x="22" y="84" width="76" height="16" rx="8" className={ink} {...line} />
      <circle cx="32" cy="92" r="3" className="fill-primary" />
      <circle cx="60" cy="92" r="3" className="fill-primary" />
      <circle cx="88" cy="92" r="3" className="fill-primary" />
      <path d="M30 84V62a4 4 0 0 1 4-4h20l8 12v14z" className="fill-primary-container" />
      <path d="M30 84V62a4 4 0 0 1 4-4h20l8 12v14zM62 70h22v14" className={ink} {...line} />
      <path d="M38 64h12l5 8H38z" className="fill-primary/25 stroke-on-surface" strokeWidth="2" strokeLinejoin="round" />
      <path d="M72 70l24-42 26 18" className="stroke-on-surface" fill="none" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M72 70l24-42 26 18" className="stroke-tertiary-container" fill="none" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M122 46l12 22-14 6c-6-6-8-14-6-22z" className="fill-surface-container-highest" />
      <path d="M122 46l12 22-14 6c-6-6-8-14-6-22zM124 70l3 6M118 72l1 6" className={ink} {...line} />
      <path d="M84 50l8-12" className="stroke-primary" {...line} />
    </Spot>
  );
}
