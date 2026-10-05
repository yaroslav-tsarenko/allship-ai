import { ink, line, Spot, type IllustrationProps } from "./base";

function Car({ x, y, tone }: { x: number; y: number; tone: string }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <path d="M2 16v-5l6-1 6-7h14l7 7 5 1v5z" className={tone} />
      <path d="M2 16v-5l6-1 6-7h14l7 7 5 1v5" className="stroke-on-surface" {...line} />
      <circle cx="10" cy="17" r="3.5" className="fill-surface stroke-on-surface" strokeWidth="2" />
      <circle cx="32" cy="17" r="3.5" className="fill-surface stroke-on-surface" strokeWidth="2" />
    </g>
  );
}

export function CarCarrier(props: IllustrationProps) {
  return (
    <Spot {...props}>
      <path d="M6 104h148" className="stroke-outline-variant" {...line} />
      <path d="M10 62h22l10 12v18H10z" className="fill-surface-container-highest" />
      <path d="M10 62h22l10 12v18H10zM15 67h14l6 8H15z" className={ink} {...line} />
      <path d="M42 90h106M48 66h98l4-6M48 90V66M146 66v24" className={ink} {...line} />
      <path d="M56 66l18-6M96 66l18-6" className="stroke-outline" {...line} />
      <Car x={52} y={44} tone="fill-primary-container" />
      <Car x={100} y={44} tone="fill-tertiary-container" />
      <Car x={52} y={70} tone="fill-secondary-container" />
      <Car x={100} y={70} tone="fill-primary/30" />
      <circle cx="26" cy="96" r="8" className="fill-surface stroke-on-surface" strokeWidth="2" />
      <circle cx="98" cy="96" r="8" className="fill-surface stroke-on-surface" strokeWidth="2" />
      <circle cx="132" cy="96" r="8" className="fill-surface stroke-on-surface" strokeWidth="2" />
    </Spot>
  );
}
