import { line, Spot, type IllustrationProps } from "./base";

const lanes = [
  "M14 84c26-8 40-30 64-34s44 10 68-6",
  "M22 30c20 10 34 26 56 20s34-22 60-14",
  "M40 106c10-20 26-34 38-56",
];

export function MapGrid(props: IllustrationProps) {
  return (
    <Spot {...props}>
      {Array.from({ length: 7 }, (_, r) =>
        Array.from({ length: 9 }, (_, c) => (
          <circle
            key={`${r}-${c}`}
            cx={12 + c * 17}
            cy={10 + r * 17}
            r="1.2"
            className="fill-outline-variant"
          />
        )),
      )}
      {lanes.map((d, i) => (
        <path
          key={d}
          d={d}
          className={i === 0 ? "stroke-primary" : "stroke-outline"}
          strokeDasharray={i === 0 ? undefined : "2 7"}
          {...line}
          strokeWidth={i === 0 ? 3 : 2}
        />
      ))}
      <circle cx="14" cy="84" r="5" className="fill-surface stroke-primary" strokeWidth="3" />
      <circle cx="78" cy="50" r="6" className="fill-tertiary stroke-surface" strokeWidth="2" />
      <circle cx="146" cy="44" r="5" className="fill-primary" />
    </Spot>
  );
}
