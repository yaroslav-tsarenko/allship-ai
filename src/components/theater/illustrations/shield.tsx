import { ink, line, Spot, type IllustrationProps } from "./base";

export function EscrowShield(props: IllustrationProps) {
  return (
    <Spot {...props}>
      <path d="M80 12l42 14v28c0 28-18 46-42 56-24-10-42-28-42-56V26z" className="fill-primary-container" />
      <path d="M80 12l42 14v28c0 28-18 46-42 56-24-10-42-28-42-56V26z" className={ink} {...line} />
      <path d="M80 24l30 10v20c0 20-12 33-30 41" className="stroke-primary/50" {...line} />
      <rect
        x="64"
        y="52"
        width="32"
        height="26"
        rx="3"
        className="fill-surface stroke-on-surface"
        strokeWidth="2"
      />
      <path d="M70 52v-6a10 10 0 0 1 20 0v6" className={ink} {...line} />
      <circle cx="80" cy="63" r="3" className="fill-primary" />
      <path d="M80 66v5" className="stroke-primary" {...line} />
    </Spot>
  );
}
