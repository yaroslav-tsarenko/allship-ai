import { line, Spot, type IllustrationProps } from "./base";

const land =
  "M14.5 20.1L23.4 15.8L179.5 15.8L179.5 12.9L181.8 17.9L200.2 22.2L210.9 23L217.6 20.8L237.7 33L240 33.8L244.4 36.6L251.2 44.6L250.6 54.6L247.8 64L251.2 66.2L259 61.8L269.6 59.7L270.2 56.8L284.2 50.3L293.1 44.6L312.2 44.6L315.5 42.4L320.5 32.3L325 27.3L332.9 29.4L332.9 39.5L337.3 46L328.9 51L319.4 54.6L316.6 59.7L317.2 64.7L321.1 68.3L313.8 69.8L304.3 71.9L299.8 74.1L309.4 73.4L298.7 77L298.2 79.8L293.1 88.5L289.8 84.2L292 90.6L290.3 95.7L287 100.7L285.3 102.2L288.7 109.4L289.8 115.1L283.6 118.7L276.3 124.5L269.1 129.5L261.2 136L256.8 147.5L257.3 153.3L261.2 164.1L264 174.9L262.4 187.1L258.4 187.8L254.5 178.5L249.5 168.4L249.5 159.8L244.4 153.3L240 153.3L234.9 154.7L228.2 149.7L219.3 149.7L212 151.1L213.1 158.3L207.5 159L200.2 156.2L187.4 154.7L181.8 157.6L171.7 164.8L167.2 171.3L168.4 182.1L157.7 177.8L152.7 165.5L144.9 154L139.3 154L135.3 159.8L127.5 154.7L116.3 139.6L106.8 139.6L106.8 143.2L90.6 143.2L69.9 134.6L57 134.6L49.2 123.8L37.4 119.4L30.1 105.8L26.8 96.4L19.5 83.4L17.3 66.9L17.8 54.6L19 35.9Z";

const hubs: [number, number][] = [
  [27.9, 25.8],
  [50.8, 123.8],
  [85.5, 128.1],
  [125.3, 82.7],
  [182.9, 87],
  [222.1, 66.9],
  [170.6, 132.4],
  [240, 125.9],
  [263.5, 182.8],
  [298.2, 75.5],
];

const lanes = [
  { d: "M50.8 123.8Q110 60 182.9 87", strong: true },
  { d: "M182.9 87Q200 60 222.1 66.9", strong: true },
  { d: "M222.1 66.9Q262 56 298.2 75.5", strong: true },
  { d: "M27.9 25.8Q70 40 125.3 82.7", strong: false },
  { d: "M85.5 128.1Q128 150 170.6 132.4", strong: false },
  { d: "M170.6 132.4Q205 116 240 125.9", strong: false },
  { d: "M240 125.9Q262 150 263.5 182.8", strong: false },
  { d: "M125.3 82.7Q150 116 170.6 132.4", strong: false },
];

export function UsMap({ pinLabel = "Newark, DE", ...props }: IllustrationProps & { pinLabel?: string }) {
  return (
    <Spot viewBox="0 0 366 200" {...props}>
      <defs>
        <pattern id="us-map-dots" width="7" height="7" patternUnits="userSpaceOnUse">
          <circle cx="3.5" cy="3.5" r="0.9" className="fill-outline-variant" />
        </pattern>
      </defs>
      <path d={land} className="fill-surface-container-high" />
      <path d={land} fill="url(#us-map-dots)" />
      <path d={land} className="stroke-outline" {...line} strokeWidth="1.5" />
      {lanes.map((l) => (
        <path
          key={l.d}
          d={l.d}
          className={l.strong ? "stroke-primary" : "stroke-on-surface-variant/60"}
          strokeDasharray={l.strong ? undefined : "1 5"}
          {...line}
          strokeWidth={l.strong ? 2.5 : 2}
        />
      ))}
      {hubs.map(([x, y]) => (
        <circle key={`${x}-${y}`} cx={x} cy={y} r="3" className="fill-surface stroke-on-surface" strokeWidth="1.5" />
      ))}
      <path d="M288.4 82.9L302 104h56" className="stroke-on-surface" {...line} strokeWidth="1.5" />
      <circle cx="288.4" cy="82.9" r="9" className="fill-primary/20" />
      <path d="M288.4 82.9c-2-6-8-9-8-15a8 8 0 0 1 16 0c0 6-6 9-8 15z" className="fill-primary stroke-surface" strokeWidth="1.5" />
      <circle cx="288.4" cy="67.6" r="3" className="fill-on-primary" />
      <text x="304" y="100" className="fill-on-surface text-[10px] font-medium">
        {pinLabel}
      </text>
    </Spot>
  );
}
