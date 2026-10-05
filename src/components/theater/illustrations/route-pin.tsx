import { ink, line, Spot, type IllustrationProps } from "./base";

export function RoutePin(props: IllustrationProps) {
  return (
    <Spot {...props}>
      <path
        d="M30 92c18-4 20-26 44-30s30-22 56-30"
        className="stroke-outline"
        strokeDasharray="2 8"
        {...line}
      />
      <path
        d="M30 92c18-4 20-26 44-30"
        className="stroke-primary"
        strokeWidth="4"
        fill="none"
        strokeLinecap="round"
      />
      <circle cx="30" cy="92" r="8" className="fill-surface stroke-primary" strokeWidth="4" />
      <circle cx="74" cy="62" r="11" className="fill-primary stroke-surface" strokeWidth="3" />
      <path d="M74 56l4 10-4-2-4 2z" className="fill-on-primary" />
      <path
        d="M130 50c-3-9-14-15-14-25a14 14 0 1 1 28 0c0 10-11 16-14 25z"
        className="fill-tertiary-container"
      />
      <path d="M130 50c-3-9-14-15-14-25a14 14 0 1 1 28 0c0 10-11 16-14 25z" className={ink} {...line} />
      <circle cx="130" cy="25" r="5" className="fill-tertiary" />
    </Spot>
  );
}
