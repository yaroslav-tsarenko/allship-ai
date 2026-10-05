"use client";

import { useAction } from "next-safe-action/hooks";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { toast } from "sonner";
import { Icon } from "@/components/ui/icon";
import {
  codeIcon,
  formatBoldIcon,
  formatH2Icon,
  formatH3Icon,
  formatItalicIcon,
  formatListBulletedIcon,
  formatListNumberedIcon,
  formatQuoteIcon,
  imageIcon,
  linkIcon,
  tableIcon,
} from "@/components/ui/icons.generated";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/cn";
import { previewMarkdownAction } from "@/server/actions/blog";
import { AiMenu } from "./ai-tools";
import { LinkDialog } from "./link-picker";
import { applyEdit, block, heading, link, prefixLines, TABLE_TEMPLATE, wrap, type Edit } from "./text-ops";
import type { EditorOptions, FaqItem } from "./types";
import { uploadBlogImage } from "./upload";

type Mode = "write" | "preview" | "split";

function ToolButton({ label, shortcut, icon, onClick, disabled }: { label: string; shortcut?: string; icon: Parameters<typeof Icon>[0]["icon"]; onClick: () => void; disabled?: boolean }) {
  return (
    <button
      type="button"
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      disabled={disabled}
      aria-label={shortcut ? `${label} (${shortcut})` : label}
      title={shortcut ? `${label} (${shortcut})` : label}
      className="state-layer inline-flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-xs text-on-surface-variant disabled:cursor-not-allowed disabled:text-on-surface/38"
    >
      <Icon icon={icon} size={20} />
    </button>
  );
}

function Divider() {
  return <span aria-hidden="true" className="mx-1 h-6 w-px shrink-0 bg-outline-variant" />;
}

export function BodyEditor(props: {
  postId: string | null;
  title: string;
  excerpt: string;
  body: string;
  categoryName: string | null;
  words: number;
  minutes: number;
  options: EditorOptions;
  seo: { seoTitle: string | null; seoDescription: string | null };
  faq: FaqItem[];
  onTitle: (v: string) => void;
  onBody: (v: string) => void;
  onSeo: (seoTitle: string | null, seoDescription: string | null) => void;
  onFaq: (faq: FaqItem[]) => void;
}) {
  const { body, onBody } = props;
  const area = useRef<HTMLTextAreaElement>(null);
  const titleRef = useRef<HTMLTextAreaElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [mode, setMode] = useState<Mode>("write");
  const [html, setHtml] = useState("");
  const [linkOpen, setLinkOpen] = useState(false);
  const [uploading, setUploading] = useState(0);
  const preview = useAction(previewMarkdownAction);
  const previewRun = useRef(preview.executeAsync);
  useEffect(() => {
    previewRun.current = preview.executeAsync;
  });

  useEffect(() => {
    if (mode === "write") return;
    const handle = setTimeout(async () => {
      const result = await previewRun.current({ markdown: body });
      if (result?.data) setHtml(result.data.html);
    }, 350);
    return () => clearTimeout(handle);
  }, [body, mode]);

  const run = (make: (value: string, start: number, end: number) => Edit) => {
    const el = area.current;
    if (!el) return;
    if (mode === "preview") setMode("write");
    applyEdit(el, make(el.value, el.selectionStart, el.selectionEnd));
  };

  const insertImages = async (files: File[]) => {
    const images = files.filter((f) => f.type.startsWith("image/"));
    if (!images.length) return;
    setUploading((n) => n + images.length);
    for (const file of images) {
      try {
        const url = await uploadBlogImage(file);
        const el = area.current;
        if (el) {
          const alt = "Describe the image";
          applyEdit(el, block(el.value, el.selectionStart, el.selectionEnd, `![${alt}](${url})`, 2, alt.length));
        }
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Upload failed.");
      } finally {
        setUploading((n) => n - 1);
      }
    }
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (!(e.metaKey || e.ctrlKey) || e.altKey) return;
    const key = e.key.toLowerCase();
    if (key === "b") {
      e.preventDefault();
      run((v, s, en) => wrap(v, s, en, "**", "**", "bold text"));
    } else if (key === "i") {
      e.preventDefault();
      run((v, s, en) => wrap(v, s, en, "_", "_", "italic text"));
    } else if (key === "k") {
      e.preventDefault();
      setLinkOpen(true);
    }
  };

  const tools: Array<{ key: string; node: ReactNode }> = [
    { key: "h2", node: <ToolButton label="Heading" icon={formatH2Icon} onClick={() => run((v, s, e) => heading(v, s, e, 2))} /> },
    { key: "h3", node: <ToolButton label="Subheading" icon={formatH3Icon} onClick={() => run((v, s, e) => heading(v, s, e, 3))} /> },
    { key: "d1", node: <Divider /> },
    { key: "b", node: <ToolButton label="Bold" shortcut="Ctrl+B" icon={formatBoldIcon} onClick={() => run((v, s, e) => wrap(v, s, e, "**", "**", "bold text"))} /> },
    { key: "i", node: <ToolButton label="Italic" shortcut="Ctrl+I" icon={formatItalicIcon} onClick={() => run((v, s, e) => wrap(v, s, e, "_", "_", "italic text"))} /> },
    { key: "a", node: <ToolButton label="Link" shortcut="Ctrl+K" icon={linkIcon} onClick={() => setLinkOpen(true)} /> },
    { key: "d2", node: <Divider /> },
    { key: "ul", node: <ToolButton label="Bulleted list" icon={formatListBulletedIcon} onClick={() => run((v, s, e) => prefixLines(v, s, e, () => "- ", /^\s*[-*+]\s+/))} /> },
    { key: "ol", node: <ToolButton label="Numbered list" icon={formatListNumberedIcon} onClick={() => run((v, s, e) => prefixLines(v, s, e, (i) => `${i + 1}. `, /^\s*\d+\.\s+/))} /> },
    { key: "q", node: <ToolButton label="Quote" icon={formatQuoteIcon} onClick={() => run((v, s, e) => prefixLines(v, s, e, () => "> ", /^>\s?/))} /> },
    {
      key: "c",
      node: (
        <ToolButton
          label="Code"
          icon={codeIcon}
          onClick={() => run((v, s, e) => (v.slice(s, e).includes("\n") ? wrap(v, s, e, "```\n", "\n```", "code") : wrap(v, s, e, "`", "`", "code")))}
        />
      ),
    },
    { key: "t", node: <ToolButton label="Table" icon={tableIcon} onClick={() => run((v, s, e) => block(v, s, e, TABLE_TEMPLATE, 2, 6))} /> },
    { key: "img", node: <ToolButton label="Upload image" icon={imageIcon} onClick={() => fileRef.current?.click()} disabled={uploading > 0} /> },
  ];

  const tabs: Array<{ value: Mode; label: string; wide?: boolean }> = [
    { value: "write", label: "Write" },
    { value: "split", label: "Split", wide: true },
    { value: "preview", label: "Preview" },
  ];

  return (
    <section aria-label="Post content" className="min-w-0">
      <label htmlFor="post-title" className="sr-only">
        Title
      </label>
      <textarea
        id="post-title"
        ref={titleRef}
        rows={1}
        value={props.title}
        maxLength={200}
        placeholder="Title"
        onChange={(e) => props.onTitle(e.target.value.replace(/\n/g, " "))}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            area.current?.focus();
          }
        }}
        className="block w-full resize-none bg-transparent text-headline-lg text-balance text-on-surface outline-none [field-sizing:content] placeholder:text-on-surface-variant/60 medium:text-display-sm"
      />

      <div className="sticky top-44 z-10 mt-4 -mx-4 flex items-center gap-1 border-y border-outline-variant bg-surface px-2 py-1 medium:mx-0 medium:rounded-md medium:border medium:bg-surface-container-low">
        <div role="toolbar" aria-label="Formatting" aria-controls="post-body" className="flex min-w-0 flex-1 items-center gap-0.5 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {tools.map((t) => (
            <span key={t.key} className="contents">
              {t.node}
            </span>
          ))}
          {uploading > 0 && (
            <span className="ml-2 inline-flex shrink-0 items-center gap-2 text-body-sm text-on-surface-variant">
              <Spinner size={14} /> Uploading
            </span>
          )}
        </div>
        <AiMenu
          postId={props.postId}
          configured={props.options.aiConfigured}
          getContext={() => ({ title: props.title, excerpt: props.excerpt, body: area.current?.value ?? body, categoryName: props.categoryName })}
          area={area}
          onSeo={props.onSeo}
          seo={props.seo}
          faq={props.faq}
          onFaq={props.onFaq}
          onTitle={(t) => !props.title.trim() && props.onTitle(t)}
          ensureWrite={() => mode === "preview" && setMode("write")}
        />
      </div>

      <div className="mt-3 flex items-center justify-between gap-3">
        <div role="tablist" aria-label="Editor view" className="inline-flex rounded-full border border-outline-variant p-0.5">
          {tabs.map((t) => (
            <button
              key={t.value}
              type="button"
              role="tab"
              aria-selected={mode === t.value}
              onClick={() => setMode(t.value)}
              className={cn(
                "state-layer h-8 cursor-pointer rounded-full px-4 text-label-lg font-medium transition-colors",
                mode === t.value ? "bg-secondary-container text-on-secondary-container" : "text-on-surface-variant",
                t.wide && "hidden large:inline-flex large:items-center",
              )}
            >
              {t.label}
            </button>
          ))}
        </div>
        <p className="text-body-sm text-on-surface-variant tabular-nums">
          {props.words.toLocaleString("en-US")} words · {props.minutes} min read
        </p>
      </div>

      <div className={cn("mt-3 grid grid-cols-1 gap-6", mode === "split" && "large:grid-cols-2")}>
        <div className={cn(mode === "preview" && "hidden")}>
          <label htmlFor="post-body" className="sr-only">
            Body in Markdown
          </label>
          <textarea
            id="post-body"
            ref={area}
            value={body}
            onChange={(e) => onBody(e.target.value)}
            onKeyDown={onKeyDown}
            onPaste={(e) => {
              const files = Array.from(e.clipboardData.files);
              if (files.some((f) => f.type.startsWith("image/"))) {
                e.preventDefault();
                void insertImages(files);
              }
            }}
            onDrop={(e) => {
              const files = Array.from(e.dataTransfer.files);
              if (files.some((f) => f.type.startsWith("image/"))) {
                e.preventDefault();
                void insertImages(files);
              }
            }}
            placeholder={"Start writing in Markdown.\n\n## Use headings for sections\n\nSelect text and press Ctrl+B for bold or Ctrl+K for a link. Paste or drop images to upload them."}
            spellCheck
            className="block min-h-[60vh] w-full resize-none rounded-md border border-outline-variant bg-surface-container-lowest px-4 py-4 text-body-lg leading-7 text-on-surface outline-none [field-sizing:content] placeholder:text-on-surface-variant/70 focus:border-primary medium:px-6 medium:py-5"
          />
        </div>
        {mode !== "write" && (
          <div aria-label="Preview" aria-busy={preview.isPending} className="min-h-[60vh] min-w-0 rounded-md border border-outline-variant bg-surface px-4 py-4 medium:px-6 medium:py-5">
            {body.trim() ? <div className="prose-article" dangerouslySetInnerHTML={{ __html: html }} /> : <p className="text-body-lg text-on-surface-variant">Nothing to preview yet.</p>}
          </div>
        )}
      </div>

      <input
        ref={fileRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="sr-only"
        tabIndex={-1}
        onChange={(e) => {
          const files = Array.from(e.target.files ?? []);
          e.target.value = "";
          void insertImages(files);
        }}
      />

      <LinkDialog
        open={linkOpen}
        onOpenChange={setLinkOpen}
        options={props.options}
        excludeId={props.postId}
        selectedText={() => {
          const el = area.current;
          return el ? el.value.slice(el.selectionStart, el.selectionEnd) : "";
        }}
        onPick={(href, label) => {
          const el = area.current;
          if (!el) return;
          if (mode === "preview") setMode("write");
          requestAnimationFrame(() => applyEdit(el, link(el.value, el.selectionStart, el.selectionEnd, href, label)));
        }}
      />
    </section>
  );
}
