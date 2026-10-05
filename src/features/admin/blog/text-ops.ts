export type Edit = { start: number; end: number; text: string; selectStart: number; selectEnd: number };

export function replaceRange(el: HTMLTextAreaElement, start: number, end: number, text: string, selectStart = start + text.length, selectEnd = selectStart) {
  el.focus({ preventScroll: true });
  el.setSelectionRange(start, end);
  let done = false;
  if (document.activeElement === el) {
    try {
      done = document.execCommand("insertText", false, text);
    } catch {
      done = false;
    }
  }
  if (!done) {
    el.setRangeText(text, start, end, "end");
    el.dispatchEvent(new Event("input", { bubbles: true }));
  }
  el.setSelectionRange(selectStart, selectEnd);
}

export function applyEdit(el: HTMLTextAreaElement, edit: Edit) {
  replaceRange(el, edit.start, edit.end, edit.text, edit.selectStart, edit.selectEnd);
}

export function wrap(value: string, start: number, end: number, before: string, after: string, placeholder: string): Edit {
  const selected = value.slice(start, end);
  if (selected && value.slice(start - before.length, start) === before && value.slice(end, end + after.length) === after) {
    return { start: start - before.length, end: end + after.length, text: selected, selectStart: start - before.length, selectEnd: end - before.length };
  }
  const inner = selected || placeholder;
  return { start, end, text: `${before}${inner}${after}`, selectStart: start + before.length, selectEnd: start + before.length + inner.length };
}

function lineBounds(value: string, start: number, end: number) {
  const lineStart = value.lastIndexOf("\n", start - 1) + 1;
  const nl = value.indexOf("\n", end > start && value[end - 1] === "\n" ? end - 1 : end);
  return { lineStart, lineEnd: nl === -1 ? value.length : nl };
}

export function prefixLines(value: string, start: number, end: number, prefix: (index: number) => string, pattern: RegExp): Edit {
  const { lineStart, lineEnd } = lineBounds(value, start, end);
  const lines = value.slice(lineStart, lineEnd).split("\n");
  const all = lines.every((l) => pattern.test(l) || !l.trim());
  const next = lines.map((l, i) => (all ? l.replace(pattern, "") : `${prefix(i)}${l.replace(pattern, "")}`)).join("\n");
  return { start: lineStart, end: lineEnd, text: next, selectStart: lineStart, selectEnd: lineStart + next.length };
}

export function heading(value: string, start: number, end: number, level: 2 | 3): Edit {
  const marker = `${"#".repeat(level)} `;
  const { lineStart, lineEnd } = lineBounds(value, start, start);
  const line = value.slice(lineStart, lineEnd);
  const stripped = line.replace(/^#{1,6}\s+/, "");
  const text = line.startsWith(marker) ? stripped : `${marker}${stripped}`;
  const caret = lineStart + text.length;
  return { start: lineStart, end: lineEnd, text, selectStart: end === start ? caret : lineStart, selectEnd: caret };
}

export function block(value: string, start: number, end: number, text: string, selectFrom = 0, selectLength = 0): Edit {
  const before = value.slice(0, start);
  const after = value.slice(end);
  const lead = before.length === 0 || before.endsWith("\n\n") ? "" : before.endsWith("\n") ? "\n" : "\n\n";
  const trail = after.length === 0 || after.startsWith("\n\n") ? "" : after.startsWith("\n") ? "\n" : "\n\n";
  const full = `${lead}${text}${trail}`;
  const base = start + lead.length + selectFrom;
  return { start, end, text: full, selectStart: base, selectEnd: base + selectLength };
}

export function link(value: string, start: number, end: number, href: string, label?: string): Edit {
  const selected = value.slice(start, end) || label || "link text";
  const text = `[${selected}](${href})`;
  return { start, end, text, selectStart: start + 1, selectEnd: start + 1 + selected.length };
}

export const TABLE_TEMPLATE = "| Option | What it covers | Typical cost |\n| --- | --- | --- |\n| Basic | | |\n| Full | | |";

export function headingAt(value: string, caret: number) {
  const lineEnd = value.indexOf("\n", caret);
  const before = value.slice(0, lineEnd === -1 ? value.length : lineEnd).split("\n");
  for (let i = before.length - 1; i >= 0; i--) {
    const m = before[i]!.match(/^#{2,3}\s+(.+)$/);
    if (m) return m[1]!.trim();
  }
  return null;
}
