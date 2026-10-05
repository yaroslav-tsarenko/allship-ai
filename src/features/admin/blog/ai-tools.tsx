"use client";

import * as Menu from "@radix-ui/react-dropdown-menu";
import { useAction } from "next-safe-action/hooks";
import { useMemo, useState, type RefObject } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Icon } from "@/components/ui/icon";
import { keyboardArrowDownIcon, stylusNoteIcon } from "@/components/ui/icons.generated";
import { Spinner } from "@/components/ui/spinner";
import { TextField } from "@/components/ui/text-field";
import { aiWritingAction } from "@/server/actions/blog";
import type { LinkSuggestion, WritingResult, WritingTask } from "@/server/ai/writing";
import { block, headingAt, replaceRange } from "./text-ops";
import { topicProposals } from "./topics";
import type { FaqItem } from "./types";

const menuClass = "z-50 max-h-[min(480px,var(--radix-dropdown-menu-content-available-height))] min-w-[260px] overflow-y-auto rounded-xs bg-surface-container py-2 text-on-surface shadow-elevation-2 outline-none";
const itemClass = "state-layer flex min-h-12 cursor-pointer flex-col justify-center px-4 py-2 outline-none select-none data-highlighted:bg-on-surface/8";

const OFFLINE_NOTE = "Offline suggestion: built from templates and rules because no AI model is configured.";

type Ctx = { title: string; excerpt: string; body: string; categoryName: string | null };

function Item({ title, detail, onSelect }: { title: string; detail: string; onSelect: () => void }) {
  return (
    <Menu.Item className={itemClass} onSelect={onSelect}>
      <span className="text-body-lg">{title}</span>
      <span className="text-body-sm text-on-surface-variant">{detail}</span>
    </Menu.Item>
  );
}

export function AiMenu({
  postId,
  configured,
  getContext,
  area,
  seo,
  onSeo,
  faq,
  onFaq,
  onTitle,
  ensureWrite,
}: {
  postId: string | null;
  configured: boolean;
  getContext: () => Ctx;
  area: RefObject<HTMLTextAreaElement | null>;
  seo: { seoTitle: string | null; seoDescription: string | null };
  onSeo: (t: string | null, d: string | null) => void;
  faq: FaqItem[];
  onFaq: (f: FaqItem[]) => void;
  onTitle: (t: string) => void;
  ensureWrite: () => void;
}) {
  const ai = useAction(aiWritingAction);
  const [busy, setBusy] = useState<WritingTask | null>(null);
  const [outlineOpen, setOutlineOpen] = useState(false);
  const [topic, setTopic] = useState("");
  const [outline, setOutline] = useState<{ text: string; offline: boolean } | null>(null);
  const [links, setLinks] = useState<{ items: LinkSuggestion[]; offline: boolean } | null>(null);
  const [applied, setApplied] = useState<string[]>([]);

  const call = async (task: WritingTask, extra: { topic?: string; heading?: string; selection?: string } = {}): Promise<WritingResult | null> => {
    const ctx = getContext();
    setBusy(task);
    const result = await ai.executeAsync({ postId, task, ...extra, title: ctx.title.slice(0, 200), excerpt: ctx.excerpt.slice(0, 600), body: ctx.body, categoryName: ctx.categoryName });
    setBusy(null);
    if (!result?.data) {
      const v = result?.validationErrors as { selection?: { _errors?: string[] } } | undefined;
      toast.error(result?.serverError ?? v?.selection?._errors?.[0] ?? "The writing assistant couldn't finish.");
      return null;
    }
    return result.data as WritingResult;
  };

  const restoreBody = (previous: string) => {
    const el = area.current;
    if (!el) return;
    replaceRange(el, 0, el.value.length, previous, 0, 0);
  };

  const undoToast = (message: string, offline: boolean, undo: () => void) => toast(message, { description: offline ? OFFLINE_NOTE : undefined, action: { label: "Undo", onClick: undo }, duration: 10_000 });

  const transform = async (task: "improve" | "shorten" | "friendlier") => {
    const el = area.current;
    if (!el) return;
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const selection = el.value.slice(start, end);
    if (!selection.trim()) return toast("Select the text you want to change first.");
    const before = el.value;
    const result = await call(task, { selection });
    if (!result || result.kind !== "replace") return;
    if (result.text === selection) return toast("No changes suggested for this text.", { description: result.offline ? OFFLINE_NOTE : undefined });
    ensureWrite();
    const at = el.value.slice(start, end) === selection ? start : el.value.indexOf(selection);
    if (at < 0) return toast.error("The text changed while the suggestion was loading. Try again.");
    replaceRange(el, at, at + selection.length, result.text, at, at + result.text.length);
    undoToast(task === "shorten" ? "Selection shortened" : task === "friendlier" ? "Tone updated" : "Selection improved", result.offline, () => restoreBody(before));
  };

  const draftSection = async () => {
    const el = area.current;
    if (!el) return;
    const caret = el.selectionEnd;
    const h = headingAt(el.value, caret);
    if (!h) return toast("Put the cursor under a ## heading to draft that section.");
    const before = el.value;
    const result = await call("draft_section", { heading: h });
    if (!result || result.kind !== "insert") return;
    ensureWrite();
    const lineStart = el.value.lastIndexOf("\n", caret - 1) + 1;
    const lineEndIdx = el.value.indexOf("\n", caret);
    const lineEnd = lineEndIdx === -1 ? el.value.length : lineEndIdx;
    const pos = /^#{2,3}\s/.test(el.value.slice(lineStart, lineEnd)) ? lineEnd : caret;
    const edit = block(el.value, pos, pos, result.text);
    replaceRange(el, edit.start, edit.end, edit.text, edit.start + edit.text.length);
    undoToast(`Drafted “${h}”`, result.offline, () => restoreBody(before));
  };

  const runOutline = async (value: string) => {
    if (!value.trim()) return;
    const result = await call("outline", { topic: value.trim().slice(0, 200) });
    if (result?.kind === "insert") setOutline({ text: result.text, offline: result.offline });
  };

  const insertOutline = () => {
    const el = area.current;
    if (!el || !outline) return;
    ensureWrite();
    const before = el.value;
    const pos = el.value.trim() ? el.selectionEnd : 0;
    const edit = el.value.trim() ? block(el.value, pos, pos, outline.text) : { start: 0, end: el.value.length, text: outline.text };
    replaceRange(el, edit.start, edit.end, edit.text, edit.start, edit.start);
    onTitle(topic.trim());
    setOutlineOpen(false);
    setOutline(null);
    undoToast("Outline added", outline.offline, () => restoreBody(before));
  };

  const runSeo = async () => {
    const prev = { ...seo };
    const result = await call("seo");
    if (!result || result.kind !== "seo") return;
    onSeo(result.seoTitle, result.seoDescription);
    undoToast("SEO title and description filled in", result.offline, () => onSeo(prev.seoTitle, prev.seoDescription));
  };

  const runFaqs = async () => {
    const prev = faq;
    const result = await call("faqs");
    if (!result || result.kind !== "faqs") return;
    const known = new Set(prev.map((f) => f.question.trim().toLowerCase()));
    const fresh = result.items.filter((i) => !known.has(i.question.trim().toLowerCase()));
    if (!fresh.length) return toast("No new questions found. Add ## headings with a paragraph under each and try again.", { description: result.offline ? OFFLINE_NOTE : undefined });
    onFaq([...prev, ...fresh]);
    undoToast(`${fresh.length} FAQ${fresh.length === 1 ? "" : "s"} added to the FAQ section`, result.offline, () => onFaq(prev));
  };

  const runLinks = async () => {
    const result = await call("internal_links");
    if (!result || result.kind !== "links") return;
    setApplied([]);
    setLinks({ items: result.items, offline: result.offline });
  };

  const applyLink = (s: LinkSuggestion) => {
    const el = area.current;
    if (!el) return;
    const value = el.value;
    const re = new RegExp(`(?<![\\[\\w])${s.anchor.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(?![\\w\\]])`, "i");
    let idx = -1;
    let m: RegExpExecArray | null;
    const global = new RegExp(re.source, "gi");
    while ((m = global.exec(value))) {
      const lineStart = value.lastIndexOf("\n", m.index) + 1;
      const line = value.slice(lineStart, value.indexOf("\n", m.index) === -1 ? value.length : value.indexOf("\n", m.index));
      if (!/^#{1,6}\s/.test(line) && value[m.index + m[0].length] !== "]") {
        idx = m.index;
        break;
      }
    }
    if (idx < 0) return toast.error(`Couldn't find “${s.anchor}” outside a heading.`);
    ensureWrite();
    const before = value;
    const original = value.slice(idx, idx + s.anchor.length);
    const text = `[${original}](${s.href})`;
    replaceRange(el, idx, idx + s.anchor.length, text, idx, idx + text.length);
    setApplied((a) => [...a, s.href]);
    undoToast(`Linked “${original}”`, false, () => {
      restoreBody(before);
      setApplied((a) => a.filter((h) => h !== s.href));
    });
  };

  const topicGroups = useMemo(() => [...new Set(topicProposals.map((t) => t.pillar))], []);
  const q = topic.trim().toLowerCase();
  const matching = topicProposals.filter((t) => !q || t.title.toLowerCase().includes(q));

  return (
    <>
      <Menu.Root modal={false}>
        <Menu.Trigger asChild>
          <button
            type="button"
            className="state-layer inline-flex h-9 shrink-0 cursor-pointer items-center gap-1.5 rounded-xs pr-2 pl-2.5 text-label-lg font-medium text-primary"
            aria-label={configured ? "Writing tools" : "Writing tools (offline)"}
          >
            {busy ? <Spinner size={18} /> : <Icon icon={stylusNoteIcon} size={20} />}
            <span className="hidden medium:inline">Assist</span>
            <Icon icon={keyboardArrowDownIcon} size={18} />
          </button>
        </Menu.Trigger>
        <Menu.Portal>
          <Menu.Content align="end" sideOffset={4} className={menuClass}>
            {!configured && <p className="px-4 pt-1 pb-2 text-body-sm text-on-surface-variant">Offline mode: rule-based suggestions, no AI model.</p>}
            <Menu.Label className="px-4 pt-1 pb-1 text-label-md font-medium text-on-surface-variant">Write</Menu.Label>
            <Item title="Outline from topic" detail="Start from a topic or the SEO plan" onSelect={() => setOutlineOpen(true)} />
            <Item title="Draft this section" detail="Writes under the heading at the cursor" onSelect={() => void draftSection()} />
            <Menu.Separator className="my-2 h-px bg-outline-variant" />
            <Menu.Label className="px-4 pt-1 pb-1 text-label-md font-medium text-on-surface-variant">Selected text</Menu.Label>
            <Item title="Improve" detail="Clearer, more specific wording" onSelect={() => void transform("improve")} />
            <Item title="Shorten" detail="Same facts, fewer words" onSelect={() => void transform("shorten")} />
            <Item title="Make friendlier" detail="Warmer tone with contractions" onSelect={() => void transform("friendlier")} />
            <Menu.Separator className="my-2 h-px bg-outline-variant" />
            <Menu.Label className="px-4 pt-1 pb-1 text-label-md font-medium text-on-surface-variant">Search and links</Menu.Label>
            <Item title="SEO title and description" detail="Fills the search appearance fields" onSelect={() => void runSeo()} />
            <Item title="Suggest FAQs" detail="Adds questions answered by the post" onSelect={() => void runFaqs()} />
            <Item title="Suggest internal links" detail="Pages and guides to link from this post" onSelect={() => void runLinks()} />
          </Menu.Content>
        </Menu.Portal>
      </Menu.Root>

      <Dialog
        open={outlineOpen}
        onOpenChange={(o) => {
          setOutlineOpen(o);
          if (!o) setOutline(null);
        }}
        title={outline ? "Outline" : "Outline from topic"}
        description={outline ? (outline.offline ? OFFLINE_NOTE : "Review the outline, then add it to the post.") : "Type a topic or pick one from the SEO plan."}
        className="max-w-[680px]"
        actions={
          outline ? (
            <>
              <Button variant="text" onClick={() => setOutline(null)}>
                Back
              </Button>
              <Button onClick={insertOutline}>Add to post</Button>
            </>
          ) : (
            <>
              <Button variant="text" onClick={() => setOutlineOpen(false)}>
                Cancel
              </Button>
              <Button onClick={() => void runOutline(topic)} disabled={!topic.trim()} loading={busy === "outline"}>
                Create outline
              </Button>
            </>
          )
        }
      >
        {outline ? (
          <pre className="max-h-[50vh] overflow-auto rounded-md bg-surface-container-lowest p-4 font-mono text-body-sm whitespace-pre-wrap text-on-surface">{outline.text}</pre>
        ) : (
          <>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                void runOutline(topic);
              }}
            >
              <TextField label="Topic" value={topic} maxLength={200} onChange={(e) => setTopic(e.target.value)} autoFocus />
            </form>
            <div className="-mx-6 max-h-[40vh] overflow-y-auto border-t border-outline-variant">
              {topicGroups.map((g) => {
                const items = matching.filter((t) => t.pillar === g);
                if (!items.length) return null;
                return (
                  <div key={g} role="group" aria-label={g}>
                    <p className="px-6 pt-4 pb-1 text-label-md font-medium text-on-surface-variant">{g}</p>
                    <ul>
                      {items.map((t) => (
                        <li key={t.title}>
                          <button type="button" onClick={() => setTopic(t.title)} aria-pressed={topic === t.title} className="state-layer w-full cursor-pointer px-6 py-2.5 text-left text-body-lg text-on-surface aria-pressed:bg-secondary-container aria-pressed:text-on-secondary-container">
                            {t.title}
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </Dialog>

      <Dialog
        open={links !== null}
        onOpenChange={(o) => !o && setLinks(null)}
        title="Suggested internal links"
        description={links?.offline ? OFFLINE_NOTE : "Each link goes on the first matching phrase in the body."}
        className="max-w-[640px]"
        actions={<Button onClick={() => setLinks(null)}>Done</Button>}
      >
        {links && links.items.length === 0 && <p className="text-body-md text-on-surface-variant">No good matches. Mention a service, tool or guide by name and try again.</p>}
        <ul className="-mx-6 divide-y divide-outline-variant border-y border-outline-variant">
          {links?.items.map((s) => {
            const done = applied.includes(s.href);
            return (
              <li key={s.href} className="flex items-center gap-4 px-6 py-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-body-lg text-on-surface">{s.label}</p>
                  <p className="truncate font-mono text-body-sm text-on-surface-variant">{s.href}</p>
                  <p className="mt-0.5 text-body-sm text-on-surface-variant">
                    Anchor: “{s.anchor}” · {s.reason}
                  </p>
                </div>
                <Button variant={done ? "text" : "tonal"} size="sm" disabled={done} onClick={() => applyLink(s)}>
                  {done ? "Linked" : "Add link"}
                </Button>
              </li>
            );
          })}
        </ul>
      </Dialog>
    </>
  );
}
