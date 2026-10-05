import { ink, line, Spot, type IllustrationProps } from "./base";

export function Truck(props: IllustrationProps) {
  return (
    <Spot {...props}>
      <path d="M12 98h136" className="stroke-outline-variant" {...line} />
      <rect x="18" y="34" width="82" height="52" rx="3" className="fill-primary-container" />
      <path d="M100 50h22l14 18v18h-36z" className="fill-surface-container-highest" />
      <path d="M106 56h14l9 12h-23z" className="fill-primary/25" />
      <path
        d="M18 37a3 3 0 0 1 3-3h76a3 3 0 0 1 3 3v49H18zM100 50h22l14 18v18h-36M106 56h14l9 12h-23z"
        className={ink}
        {...line}
      />
      <path d="M30 48h40M30 58h28" className="stroke-primary" {...line} />
      <circle cx="42" cy="88" r="9" className="fill-surface stroke-on-surface" strokeWidth="2" />
      <circle cx="118" cy="88" r="9" className="fill-surface stroke-on-surface" strokeWidth="2" />
      <circle cx="42" cy="88" r="3" className="fill-primary" />
      <circle cx="118" cy="88" r="3" className="fill-primary" />
    </Spot>
  );
}
