import { ink, line, Spot, type IllustrationProps } from "./base";

export function Pallet(props: IllustrationProps) {
  return (
    <Spot {...props}>
      <path d="M12 102h136" className="stroke-outline-variant" {...line} />
      <rect x="40" y="58" width="36" height="30" rx="2" className="fill-tertiary-container" />
      <rect x="80" y="58" width="40" height="30" rx="2" className="fill-primary-container" />
      <rect x="56" y="26" width="44" height="32" rx="2" className="fill-surface-container-highest" />
      <path
        d="M40 60a2 2 0 0 1 2-2h32a2 2 0 0 1 2 2v28H40zM80 60a2 2 0 0 1 2-2h36a2 2 0 0 1 2 2v28H80zM56 28a2 2 0 0 1 2-2h40a2 2 0 0 1 2 2v30H56z"
        className={ink}
        {...line}
      />
      <path d="M58 58v-8M98 58v-8M70 26v10h16V26M52 58v10M100 58v10" className="stroke-primary" {...line} />
      <path d="M34 88h92v6H34zM34 94v8M80 94v8M126 94v8" className={ink} {...line} />
    </Spot>
  );
}
