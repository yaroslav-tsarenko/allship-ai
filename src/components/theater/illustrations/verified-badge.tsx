import { ink, line, Spot, type IllustrationProps } from "./base";

export function VerifiedBadge(props: IllustrationProps) {
  return (
    <Spot {...props}>
      <rect x="28" y="22" width="104" height="72" rx="6" className="fill-surface-container-highest" />
      <rect x="28" y="22" width="104" height="72" rx="6" className={ink} {...line} />
      <rect x="40" y="36" width="26" height="30" rx="3" className="fill-primary-container" />
      <path d="M74 40h44M74 50h32M74 60h38M40 78h48" className="stroke-outline" {...line} />
      <text x="40" y="34" className="fill-on-surface-variant text-[7px] font-medium tracking-[0.12em]">
        USDOT
      </text>
      <circle cx="118" cy="86" r="18" className="fill-success-container stroke-on-surface" strokeWidth="2" />
      <path
        d="M110 86l6 6 10-12"
        className="stroke-success"
        fill="none"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Spot>
  );
}
