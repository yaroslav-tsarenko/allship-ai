import { ink, line, Spot, type IllustrationProps } from "./base";

function Badge({ x, n, to = 44 }: { x: number; n: number; to?: number }) {
  return (
    <g>
      <circle cx={x} cy="20" r="10" className="fill-surface stroke-on-surface" strokeWidth="2" />
      <text x={x} y="24" textAnchor="middle" className="fill-on-surface font-mono text-[11px] font-medium">
        {n}
      </text>
      <path d={`M${x} 30V${to}`} className="stroke-on-surface" {...line} strokeWidth="1.5" />
    </g>
  );
}

export function ServicesTruck(props: IllustrationProps) {
  return (
    <Spot viewBox="0 0 360 170" {...props}>
      <path d="M8 152h344" className="stroke-outline-variant" {...line} />
      <rect x="18" y="44" width="76" height="86" className="fill-primary/15" />
      <rect x="94" y="44" width="80" height="86" className="fill-tertiary/15" />
      <rect x="174" y="44" width="78" height="86" className="fill-secondary/15" />
      <rect x="40" y="94" width="24" height="36" rx="2" className="fill-surface-container-highest" />
      <rect x="62" y="104" width="22" height="26" rx="2" className="fill-surface" />
      <path d="M40 96a2 2 0 0 1 2-2h20a2 2 0 0 1 2 2v34H40zM62 106a2 2 0 0 1 2-2h18a2 2 0 0 1 2 2v24H62zM28 130V82h10M33 82v48" className={ink} {...line} />
      <path d="M46 104h12M68 112h10" className="stroke-primary" {...line} />
      <path d="M102 122v-6l7-1 7-9h22l8 9 6 1v6z" className="fill-surface" />
      <path d="M102 122v-6l7-1 7-9h22l8 9 6 1v6z" className={ink} {...line} />
      <circle cx="112" cy="123" r="4" className="fill-surface stroke-on-surface" strokeWidth="2" />
      <circle cx="142" cy="123" r="4" className="fill-surface stroke-on-surface" strokeWidth="2" />
      <rect x="186" y="96" width="52" height="26" rx="2" className="fill-surface" />
      <path d="M186 98a2 2 0 0 1 2-2h48a2 2 0 0 1 2 2v24h-52zM180 122h64v6h-64z" className={ink} {...line} />
      <path d="M212 96v10M198 110h28" className="stroke-primary" {...line} />
      <rect x="196" y="62" width="34" height="34" rx="2" className="fill-surface-container-highest" />
      <path d="M196 64a2 2 0 0 1 2-2h30a2 2 0 0 1 2 2v32h-34z" className={ink} {...line} />
      <path d="M18 44h234v86H18zM94 44v86M174 44v86" className={ink} {...line} />
      <path d="M252 72h40l26 28v30h-66z" className="fill-surface-container-highest" />
      <path d="M262 80h28l18 20h-46z" className="fill-primary/20" />
      <circle cx="282" cy="92" r="5" className="fill-surface stroke-on-surface" strokeWidth="1.5" />
      <path d="M274 100c1-4 4-6 8-6s7 2 8 6" className="stroke-on-surface" {...line} strokeWidth="1.5" />
      <path d="M252 72h40l26 28v30h-66zM262 80h28l18 20h-46z" className={ink} {...line} />
      <path d="M308 116h10" className="stroke-primary" {...line} />
      {[44, 76, 206, 236, 300].map((cx) => (
        <g key={cx}>
          <circle cx={cx} cy="138" r="11" className="fill-surface stroke-on-surface" strokeWidth="2" />
          <circle cx={cx} cy="138" r="3.5" className="fill-primary" />
        </g>
      ))}
      <Badge x={56} n={1} />
      <Badge x={134} n={2} />
      <Badge x={213} n={3} />
      <Badge x={290} n={4} to={72} />
    </Spot>
  );
}
