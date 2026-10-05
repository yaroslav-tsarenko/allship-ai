"use client";

import { useAction } from "next-safe-action/hooks";
import Image from "next/image";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { IconButton } from "@/components/ui/icon-button";
import { addIcon, arrowUpwardIcon, checkCircleIcon, closeIcon, deleteIcon, keyboardArrowDownIcon, uploadIcon, warningIcon } from "@/components/ui/icons.generated";
import { SelectField } from "@/components/ui/select-field";
import { Spinner } from "@/components/ui/spinner";
import { TextArea } from "@/components/ui/text-area";
import { TextField } from "@/components/ui/text-field";
import { cn } from "@/lib/cn";
import { checkSlugAction, createTagAction } from "@/server/actions/blog";
import { EXCERPT_MAX, SEO_DESCRIPTION_MAX, SEO_DESCRIPTION_MIN, SEO_TITLE_MAX, slugify, type PostStatus, type PublishIssue } from "./rules";
import type { EditorFields, EditorOptions } from "./types";
import { uploadBlogImage } from "./upload";

const TITLE_SUFFIX = " · AllShip AI";
const dateTimeFmt = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" });

function Section({ title, summary, defaultOpen = true, children }: { title: string; summary?: ReactNode; defaultOpen?: boolean; children: ReactNode }) {
  return (
    <details open={defaultOpen} className="group border-b border-outline-variant last:border-b-0">
      <summary className="state-layer flex cursor-pointer list-none items-center gap-3 px-5 py-4 [&::-webkit-details-marker]:hidden">
        <span className="flex-1 text-title-sm text-on-surface">{title}</span>
        {summary && <span className="truncate text-body-sm text-on-surface-variant">{summary}</span>}
        <Icon icon={keyboardArrowDownIcon} size={20} className="shrink-0 text-on-surface-variant transition-transform group-open:rotate-180" />
      </summary>
      <div className="flex flex-col gap-4 px-5 pb-5">{children}</div>
    </details>
  );
}

function counterTone(n: number, min: number, max: number) {
  return n === 0 ? "text-on-surface-variant" : n < min || n > max ? "text-error" : "text-success";
}

export function SettingsPanel({
  postId,
  fields,
  update,
  options,
  onTagCreated,
  liveSlug,
  slugError,
  onSlugTouched,
  issues,
  status,
  publishedAt,
  authorName,
}: {
  postId: string | null;
  fields: EditorFields;
  update: <K extends keyof EditorFields>(key: K, value: EditorFields[K]) => void;
  options: EditorOptions;
  onTagCreated: (t: { id: string; slug: string; name: string }) => void;
  liveSlug: string | null;
  slugError: string | null;
  onSlugTouched: () => void;
  issues: PublishIssue[];
  status: PostStatus;
  publishedAt: string | null;
  authorName: string;
}) {
  const checkSlug = useAction(checkSlugAction);
  const createTag = useAction(createTagAction);
  const [slugState, setSlugState] = useState<{ slug: string; available: boolean; message: string | null } | null>(null);
  const [tagInput, setTagInput] = useState("");
  const [coverBusy, setCoverBusy] = useState(false);
  const coverInput = useRef<HTMLInputElement>(null);
  const checkRef = useRef(checkSlug.executeAsync);
  useEffect(() => {
    checkRef.current = checkSlug.executeAsync;
  });

  useEffect(() => {
    if (!fields.slug) return;
    const handle = setTimeout(async () => {
      const result = await checkRef.current({ slug: fields.slug, postId });
      if (result?.data) setSlugState(result.data);
    }, 400);
    return () => clearTimeout(handle);
  }, [fields.slug, postId]);

  const selectedTags = fields.tagIds.map((id) => options.tags.find((t) => t.id === id)).filter((t): t is NonNullable<typeof t> => Boolean(t));

  const addTag = async () => {
    const name = tagInput.trim();
    if (!name) return;
    const existing = options.tags.find((t) => t.name.toLowerCase() === name.toLowerCase() || t.slug === slugify(name));
    if (existing) {
      if (!fields.tagIds.includes(existing.id)) update("tagIds", [...fields.tagIds, existing.id]);
      setTagInput("");
      return;
    }
    const result = await createTag.executeAsync({ name });
    if (!result?.data) return toast.error(result?.serverError ?? "Couldn't create the tag.");
    onTagCreated(result.data);
    update("tagIds", [...fields.tagIds, result.data.id]);
    setTagInput("");
  };

  const uploadCover = async (file: File | undefined) => {
    if (!file) return;
    setCoverBusy(true);
    try {
      const url = await uploadBlogImage(file);
      update("coverKey", url);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Upload failed.");
    } finally {
      setCoverBusy(false);
    }
  };

  const slugChanged = Boolean(liveSlug && fields.slug !== liveSlug);
  const slugMessage = slugError ?? (slugState && slugState.slug === slugify(fields.slug) && !slugState.available ? slugState.message : null);
  const seoTitleShown = (fields.seoTitle?.trim() || fields.title.trim() || "Untitled post") + TITLE_SUFFIX;
  const descLen = fields.seoDescription?.trim().length ?? 0;
  const snippetDesc = fields.seoDescription?.trim() || fields.excerpt.trim() || "Add a meta description to control the text under your title in search results.";
  const path = `/blog/${fields.slug || "your-post"}`;
  const statusLine =
    status === "published"
      ? `Published ${publishedAt ? dateTimeFmt.format(new Date(publishedAt)) : ""}`
      : status === "scheduled"
        ? `Goes live ${publishedAt ? dateTimeFmt.format(new Date(publishedAt)) : ""}`
        : status === "archived"
          ? "Archived, hidden from the site"
          : "Draft, only admins can see it";

  return (
    <aside aria-label="Post settings" className="self-start rounded-xl border border-outline-variant bg-surface-container-low [--field-bg:var(--md-surface-container-low)] large:sticky large:top-48 large:max-h-[calc(100dvh-13rem)] large:overflow-y-auto">
      <div className="border-b border-outline-variant px-5 py-4">
        <p className="text-title-sm text-on-surface">{statusLine}</p>
        <p className="mt-0.5 text-body-sm text-on-surface-variant">By {authorName}</p>
        {issues.length === 0 ? (
          <p className="mt-3 flex items-center gap-2 text-body-md text-success">
            <Icon icon={checkCircleIcon} size={18} />
            {status === "draft" || status === "archived" ? "Ready to publish" : "All publishing checks pass"}
          </p>
        ) : (
          <div className="mt-3">
            <p className="text-label-lg font-medium text-on-surface-variant">Before publishing</p>
            <ul className="mt-1 flex flex-col gap-1">
              {issues.map((i) => (
                <li key={i.field} className="flex gap-2 text-body-sm text-on-surface-variant">
                  <Icon icon={warningIcon} size={16} className="mt-0.5 shrink-0 text-warning" />
                  {i.message}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <Section title="Post details">
        <div>
          <TextField
            label="URL slug"
            value={fields.slug}
            maxLength={80}
            onChange={(e) => {
              onSlugTouched();
              update("slug", e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-").replace(/-{2,}/g, "-"));
            }}
            onBlur={() => update("slug", slugify(fields.slug))}
            error={slugMessage ?? undefined}
            supportingText={<span className="break-all">{options.siteHost}/blog/{fields.slug || "…"}</span>}
            spellCheck={false}
          />
          {slugChanged && !slugMessage && (
            <p role="alert" className="mt-2 flex gap-2 rounded-xs bg-warning-container px-3 py-2 text-body-sm text-on-warning-container">
              <Icon icon={warningIcon} size={16} className="mt-0.5 shrink-0" />
              <span>
                This post is live at <span className="font-mono">/blog/{liveSlug}</span>. Changing the URL breaks existing links and search rankings.
              </span>
            </p>
          )}
        </div>
        <TextArea label="Excerpt" rows={3} maxLength={EXCERPT_MAX} showCount value={fields.excerpt} onChange={(e) => update("excerpt", e.target.value)} supportingText="Shown under the title and in post lists." />
        <SelectField label="Topic" value={fields.categoryId ?? ""} onChange={(e) => update("categoryId", e.target.value || null)} placeholder="No topic" options={options.categories.map((c) => ({ value: c.id, label: c.name }))} />
        <div>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void addTag();
            }}
          >
            <TextField
              label="Add a tag"
              value={tagInput}
              list="blog-tag-options"
              maxLength={40}
              onChange={(e) => setTagInput(e.target.value)}
              supportingText="Press Enter to add. New tags are created for you."
              trailing={createTag.isPending ? <span className="pr-3"><Spinner size={16} /></span> : tagInput.trim() ? <IconButton icon={addIcon} label="Add tag" type="submit" /> : null}
            />
          </form>
          <datalist id="blog-tag-options">
            {options.tags.filter((t) => !fields.tagIds.includes(t.id)).map((t) => (
              <option key={t.id} value={t.name} />
            ))}
          </datalist>
          {selectedTags.length > 0 && (
            <ul className="mt-3 flex flex-wrap gap-2" aria-label="Tags">
              {selectedTags.map((t) => (
                <li key={t.id} className="inline-flex h-8 items-center gap-1 rounded-sm border border-outline-variant pr-1 pl-3 text-label-lg text-on-surface-variant">
                  {t.name}
                  <button type="button" onClick={() => update("tagIds", fields.tagIds.filter((x) => x !== t.id))} aria-label={`Remove ${t.name}`} className="state-layer inline-flex size-6 cursor-pointer items-center justify-center rounded-full">
                    <Icon icon={closeIcon} size={16} />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </Section>

      <Section title="Cover image" summary={fields.coverKey ? undefined : "None"}>
        {fields.coverKey ? (
          <div className="relative aspect-[16/9] overflow-hidden rounded-md bg-surface-container-high">
            <Image src={fields.coverKey} alt={fields.coverAlt ?? ""} fill sizes="400px" className="object-cover" />
          </div>
        ) : (
          <button
            type="button"
            onClick={() => coverInput.current?.click()}
            disabled={coverBusy}
            className="state-layer flex aspect-[16/9] w-full cursor-pointer flex-col items-center justify-center gap-2 rounded-md border border-dashed border-outline text-on-surface-variant"
          >
            {coverBusy ? <Spinner size={24} /> : <Icon icon={uploadIcon} size={24} />}
            <span className="text-label-lg font-medium">{coverBusy ? "Uploading…" : "Upload cover"}</span>
            <span className="text-body-sm">JPG, PNG or WebP, up to 8 MB. 1600×900 or larger works best.</span>
          </button>
        )}
        {fields.coverKey && (
          <div className="flex gap-2">
            <Button variant="outlined" size="sm" onClick={() => coverInput.current?.click()} loading={coverBusy} leading={<Icon icon={uploadIcon} size={18} />}>
              Replace
            </Button>
            <Button variant="text" size="sm" onClick={() => update("coverKey", null)} leading={<Icon icon={deleteIcon} size={18} />}>
              Remove
            </Button>
          </div>
        )}
        <input
          ref={coverInput}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="sr-only"
          tabIndex={-1}
          onChange={(e) => {
            const file = e.target.files?.[0];
            e.target.value = "";
            void uploadCover(file);
          }}
        />
        <TextArea
          label="Alt text"
          rows={2}
          maxLength={300}
          value={fields.coverAlt ?? ""}
          onChange={(e) => update("coverAlt", e.target.value || null)}
          supportingText="Describe what the image shows for screen readers. Required to publish."
          error={fields.coverKey && !fields.coverAlt?.trim() ? "Add alt text for the cover" : undefined}
        />
      </Section>

      <Section title="Search appearance">
        <div className="rounded-md border border-outline-variant bg-surface px-4 py-3" aria-label="Google search preview">
          <p className="truncate text-body-sm text-on-surface-variant">
            {options.siteHost} › blog › {fields.slug || "your-post"}
          </p>
          <p className="mt-0.5 line-clamp-2 text-title-md font-normal text-primary">{seoTitleShown.length > 62 ? `${seoTitleShown.slice(0, 60).trimEnd()}…` : seoTitleShown}</p>
          <p className="mt-1 line-clamp-2 text-body-sm text-on-surface-variant">{snippetDesc.length > 160 ? `${snippetDesc.slice(0, 157).trimEnd()}…` : snippetDesc}</p>
        </div>
        <TextField
          label="SEO title"
          value={fields.seoTitle ?? ""}
          maxLength={120}
          onChange={(e) => update("seoTitle", e.target.value || null)}
          supportingText={
            <span className="flex justify-between gap-4">
              <span>Defaults to the post title. “{TITLE_SUFFIX.trim()}” is added.</span>
              <span className={cn("shrink-0 tabular-nums", seoTitleShown.length > SEO_TITLE_MAX ? "text-error" : "text-on-surface-variant")}>
                {seoTitleShown.length} / {SEO_TITLE_MAX}
              </span>
            </span>
          }
        />
        <TextArea
          label="Meta description"
          rows={3}
          maxLength={320}
          value={fields.seoDescription ?? ""}
          onChange={(e) => update("seoDescription", e.target.value || null)}
          supportingText={
            <span className="flex justify-between gap-4">
              <span>
                {SEO_DESCRIPTION_MIN}–{SEO_DESCRIPTION_MAX} characters. Say what the reader gets.
              </span>
              <span className={cn("shrink-0 tabular-nums", counterTone(descLen, SEO_DESCRIPTION_MIN, SEO_DESCRIPTION_MAX))}>{descLen}</span>
            </span>
          }
        />
        <TextField
          label="Canonical URL"
          value={fields.canonicalUrl ?? ""}
          maxLength={500}
          onChange={(e) => update("canonicalUrl", e.target.value || null)}
          supportingText={`Leave empty to use ${path}. Set only if this content lives at another URL.`}
          error={fields.canonicalUrl && !/^(\/|https:\/\/)\S*$/.test(fields.canonicalUrl.trim()) ? "Use a path like /blog/slug or a full https:// URL" : undefined}
          spellCheck={false}
        />
      </Section>

      <Section title="FAQ" summary={fields.faq.length ? `${fields.faq.length} question${fields.faq.length === 1 ? "" : "s"}` : "None"} defaultOpen={fields.faq.length > 0}>
        <p className="text-body-sm text-on-surface-variant">Shown at the end of the post and added to the page as FAQ structured data.</p>
        {fields.faq.map((item, i) => (
          <fieldset key={i} className="flex flex-col gap-3 border-t border-outline-variant pt-4 first-of-type:border-t-0 first-of-type:pt-0">
            <legend className="sr-only">Question {i + 1}</legend>
            <div className="flex items-center justify-between">
              <span className="text-label-lg font-medium text-on-surface-variant">Question {i + 1}</span>
              <span className="flex">
                <IconButton
                  icon={arrowUpwardIcon}
                  label="Move up"
                  disabled={i === 0}
                  onClick={() => {
                    const next = [...fields.faq];
                    [next[i - 1], next[i]] = [next[i]!, next[i - 1]!];
                    update("faq", next);
                  }}
                />
                <IconButton icon={deleteIcon} label="Remove question" onClick={() => update("faq", fields.faq.filter((_, j) => j !== i))} />
              </span>
            </div>
            <TextField label="Question" value={item.question} maxLength={300} onChange={(e) => update("faq", fields.faq.map((f, j) => (j === i ? { ...f, question: e.target.value } : f)))} />
            <TextArea label="Answer" rows={3} maxLength={1200} value={item.answer} onChange={(e) => update("faq", fields.faq.map((f, j) => (j === i ? { ...f, answer: e.target.value } : f)))} />
          </fieldset>
        ))}
        <Button variant="outlined" size="sm" className="self-start" onClick={() => update("faq", [...fields.faq, { question: "", answer: "" }])} leading={<Icon icon={addIcon} size={18} />} disabled={fields.faq.length >= 20}>
          Add question
        </Button>
      </Section>
    </aside>
  );
}
