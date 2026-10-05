import { Children, cloneElement, Fragment, isValidElement, type CSSProperties, type ReactNode } from "react";

function splitWords(node: ReactNode, counter: { i: number }): ReactNode {
  if (typeof node === "string" || typeof node === "number") {
    const parts = String(node).split(/(\s+)/);
    return parts.map((part, k) => {
      if (!part) return null;
      if (/^\s+$/.test(part)) return <Fragment key={k}>{part}</Fragment>;
      const i = counter.i++;
      return (
        <span key={k} className="rt-w">
          <span style={{ "--w": i } as CSSProperties}>{part}</span>
        </span>
      );
    });
  }
  if (Array.isArray(node)) return Children.map(node, (child) => splitWords(child, counter));
  if (isValidElement<{ children?: ReactNode }>(node)) {
    if (node.type === Fragment) return splitWords(node.props.children, counter);
    if (typeof node.type === "string" && node.props.children !== undefined) return cloneElement(node, undefined, splitWords(node.props.children, counter));
  }
  return node;
}

export function RevealText({ children, delay = 0 }: { children: ReactNode; delay?: number }) {
  return <span data-reveal-text="" style={{ "--rt-d": `${delay}ms` } as CSSProperties}>{splitWords(children, { i: 0 })}</span>;
}
