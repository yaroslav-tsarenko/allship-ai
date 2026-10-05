import { ink, line, Spot, type IllustrationProps } from "./base";

export function Dolly(props: IllustrationProps) {
  return (
    <Spot {...props}>
      <path d="M12 104h136" className="stroke-outline-variant" {...line} />
      <rect x="62" y="22" width="40" height="30" rx="2" className="fill-surface-container-highest" />
      <rect x="58" y="52" width="48" height="38" rx="2" className="fill-primary-container" />
      <path
        d="M62 24a2 2 0 0 1 2-2h36a2 2 0 0 1 2 2v28H62zM58 54a2 2 0 0 1 2-2h44a2 2 0 0 1 2 2v36H58z"
        className={ink}
        {...line}
      />
      <path d="M74 22v8h16v-8M70 64h24" className="stroke-primary" {...line} />
      <path
        d="M46 14l8 4v76h60"
        className={ink}
        fill="none"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="58" cy="98" r="6" className="fill-surface stroke-on-surface" strokeWidth="2" />
      <circle cx="100" cy="98" r="6" className="fill-surface stroke-on-surface" strokeWidth="2" />
    </Spot>
  );
}
