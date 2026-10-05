import Link from "next/link";
import { Fragment, type ReactNode } from "react";

type Options = { idHref?: (publicId: string) => string; onLink?: () => void };

const inlinePattern =
  /(\*\*[^*\n]+\*\*|`[^`\n]+`|\[[^\]\n]+\]\([^)\s]+\)|\bAS-[A-Z0-9]{4,10}\b|(?<![\w*])\*[^*\s][^*\n]*\*(?!\w))/g;
const internalHref = /^\/app(?:\/[\w\-/]*)?(?:\?[\w\-=&%.]*)?$/;

const linkClass =
  "font-medium text-primary underline decoration-primary/40 underline-offset-2 hover:decoration-primary focus-visible:rounded-xs focus-visible:outline-2 focus-visible:outline-primary";

function inline(text: string, opts: Options, key: string): ReactNode[] {
  const out: ReactNode[] = [];
  let last = 0;
  let i = 0;
  for (const match of text.matchAll(inlinePattern)) {
    const token = match[0];
    const at = match.index ?? 0;
    if (at > last) out.push(text.slice(last, at));
    const k = `${key}-${i++}`;
    if (token.startsWith("**")) {
      out.push(
        <strong key={k} className="text-on-surface font-medium">
          {inline(token.slice(2, -2), opts, k)}
        </strong>,
      );
    } else if (token.startsWith("`")) {
      out.push(
        <code key={k} className="bg-surface-container-highest rounded-xs px-1 py-px font-mono text-[0.92em]">
          {token.slice(1, -1)}
        </code>,
      );
    } else if (token.startsWith("[")) {
      const label = token.slice(1, token.indexOf("]("));
      const href = token.slice(token.indexOf("](") + 2, -1);
      out.push(
        internalHref.test(href) ? (
          <Link key={k} href={href} onClick={opts.onLink} className={linkClass}>
            {label}
          </Link>
        ) : (
          <Fragment key={k}>{label}</Fragment>
        ),
      );
    } else if (token.startsWith("AS-")) {
      out.push(
        opts.idHref ? (
          <Link key={k} href={opts.idHref(token)} onClick={opts.onLink} className={linkClass}>
            {token}
          </Link>
        ) : (
          token
        ),
      );
    } else {
      out.push(<em key={k}>{inline(token.slice(1, -1), opts, k)}</em>);
    }
    last = at + token.length;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

type ListBlock = { kind: "ul"; items: string[] } | { kind: "ol"; items: string[] };
type Block =
  { kind: "p"; lines: string[] } | ListBlock | { kind: "code"; text: string } | { kind: "h"; text: string };

export function parseBlocks(source: string): Block[] {
  const blocks: Block[] = [];
  const lines = source.replace(/\r\n?/g, "\n").split("\n");
  let current = null as Block | null;
  const flush = () => {
    if (current) blocks.push(current);
    current = null;
  };
  for (let n = 0; n < lines.length; n++) {
    const line = lines[n]!;
    if (/^\s*```/.test(line)) {
      flush();
      const body: string[] = [];
      n++;
      while (n < lines.length && !/^\s*```/.test(lines[n]!)) body.push(lines[n++]!);
      blocks.push({ kind: "code", text: body.join("\n") });
      continue;
    }
    const bullet = line.match(/^\s*[-*•]\s+(.*)$/);
    const numbered = line.match(/^\s*\d+[.)]\s+(.*)$/);
    const heading = line.match(/^\s*#{1,6}\s+(.*)$/);
    if (bullet || numbered) {
      const kind = bullet ? "ul" : "ol";
      const text = (bullet ?? numbered)![1]!;
      if (current?.kind !== kind) {
        flush();
        current = { kind, items: [] };
      }
      (current as { items: string[] }).items.push(text);
    } else if (heading) {
      flush();
      blocks.push({ kind: "h", text: heading[1]! });
    } else if (!line.trim()) {
      flush();
    } else if (current?.kind === "ul" || current?.kind === "ol") {
      if (/^\s{2,}\S/.test(line)) current.items[current.items.length - 1] += ` ${line.trim()}`;
      else {
        flush();
        current = { kind: "p", lines: [line] };
      }
    } else {
      if (current?.kind !== "p") {
        flush();
        current = { kind: "p", lines: [] };
      }
      current.lines.push(line);
    }
  }
  flush();
  return blocks;
}

export function Markdown({ text, idHref, onLink }: { text: string } & Options) {
  const opts = { idHref, onLink };
  return (
    <div className="text-body-lg text-on-surface flex flex-col gap-3 break-words">
      {parseBlocks(text).map((block, b) => {
        const key = `b${b}`;
        if (block.kind === "code")
          return (
            <pre
              key={key}
              className="bg-surface-container-highest text-body-md overflow-x-auto rounded-sm px-3 py-2 font-mono"
            >
              <code>{block.text}</code>
            </pre>
          );
        if (block.kind === "h")
          return (
            <p key={key} className="text-title-md text-on-surface">
              {inline(block.text, opts, key)}
            </p>
          );
        if (block.kind === "ul" || block.kind === "ol") {
          const List = block.kind;
          return (
            <List
              key={key}
              className={
                List === "ul"
                  ? "marker:text-on-surface-variant flex list-disc flex-col gap-1.5 pl-5"
                  : "marker:text-on-surface-variant flex list-decimal flex-col gap-1.5 pl-5"
              }
            >
              {block.items.map((item, i) => (
                <li key={`${key}-${i}`} className="pl-1">
                  {inline(item, opts, `${key}-${i}`)}
                </li>
              ))}
            </List>
          );
        }
        return (
          <p key={key}>
            {block.lines.map((line, i) => (
              <Fragment key={`${key}-${i}`}>
                {i > 0 && <br />}
                {inline(line, opts, `${key}-${i}`)}
              </Fragment>
            ))}
          </p>
        );
      })}
    </div>
  );
}
