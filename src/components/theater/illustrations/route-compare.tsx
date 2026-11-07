import { line, Spot, type IllustrationProps } from "./base";

const rows = [
  { y: 30, label: "Calling movers yourself", d: "M96 30l18 12 14-12 16 12 14-12 18 12 14-12 18 12 16-12h20" },
  {
    y: 80,
    label: "Lead site",
    d: "M96 80h40M136 80c14-26 30-26 44-8M136 80c14-10 30-10 44 0M136 80c14 10 30 10 44 0M136 80c14 26 30 26 44 8M180 80h84",
  },
  { y: 130, label: "Typical broker", d: "M96 130h80M222 130h42" },
  { y: 180, label: "AllShip AI", d: "M96 180h168" },
];

export function RouteCompare(props: IllustrationProps) {
  return (
    <Spot viewBox="0 0 212 200" {...props}>
      {rows.map((r, i) => {
        const ours = i === rows.length - 1;
        return (
          <g key={r.label}>
            <text
              x="0"
              y={r.y - 14}
              className={`${ours ? "fill-primary" : "fill-on-surface-variant"} text-[10px] font-medium`}
            >
              {r.label}
            </text>
            <g transform="translate(-82 0)">
              <circle cx="88" cy={r.y} r="5" className={ours ? "fill-primary" : "fill-outline"} />
              <path
                d={r.d}
                className={ours ? "stroke-primary" : "stroke-on-surface-variant/60"}
                {...line}
                strokeWidth={ours ? 3 : 2}
                strokeDasharray={ours ? undefined : "3 5"}
              />
              <path
                d={`M264 ${r.y + 8}v-22l14 6-14 6`}
                className={ours ? "fill-primary/20 stroke-primary" : "stroke-outline fill-none"}
                strokeWidth="2"
                strokeLinejoin="round"
                strokeLinecap="round"
              />
            </g>
          </g>
        );
      })}
      <g transform="translate(-82 0)">
        <rect
          x="176"
          y="116"
          width="46"
          height="28"
          rx="3"
          className="fill-surface-container-highest stroke-on-surface"
          strokeWidth="2"
        />
        <text x="199" y="135" textAnchor="middle" className="fill-on-surface-variant text-[13px] font-medium">
          ?
        </text>
        {[132, 180, 228].map((x) => (
          <g key={x}>
            <circle cx={x} cy="180" r="8" className="fill-success-container stroke-surface" strokeWidth="2" />
            <path
              d={`M${x - 3.5} 180l2.5 2.5 5-5.5`}
              className="stroke-success"
              fill="none"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </g>
        ))}
      </g>
    </Spot>
  );
}
