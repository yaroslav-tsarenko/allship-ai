"use client";

import * as Menu from "@radix-ui/react-dropdown-menu";
import { useAction } from "next-safe-action/hooks";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Icon } from "@/components/ui/icon";
import { IconButton } from "@/components/ui/icon-button";
import {
  archiveIcon,
  arrowBackIcon,
  checkIcon,
  deleteIcon,
  errorIcon,
  moreVertIcon,
  openInNewIcon,
  publicOffIcon,
  scheduleIcon,
  unarchiveIcon,
  visibilityIcon,
} from "@/components/ui/icons.generated";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/cn";
import { createPostAction, deletePostAction, savePostAction, setPostStatusAction } from "@/server/actions/blog";
import { BodyEditor } from "./body-editor";
import { PostStatusChip } from "./post-status-chip";
import { PublishDialog } from "./publish-dialog";
import { countWords, effectiveStatus, publishIssues, readingMinutesFor, slugify, type PostStatus } from "./rules";
import { SettingsPanel } from "./settings-panel";
import type { EditorFields, EditorInitial, EditorOptions } from "./types";

type SaveState = "idle" | "saving" | "saved" | "error" | "conflict";

const menuClass = "z-50 min-w-[220px] overflow-y-auto rounded-xs bg-surface-container py-2 text-on-surface shadow-elevation-2 outline-none";
const itemClass = "state-layer flex h-12 cursor-pointer items-center gap-3 px-3 text-body-lg outline-none select-none data-highlighted:bg-on-surface/8 data-disabled:cursor-not-allowed data-disabled:text-on-surface/38";

const timeFmt = new Intl.DateTimeFormat("en-US", { hour: "numeric", minute: "2-digit" });
const dateTimeFmt = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" });

const serialize = (f: EditorFields) => JSON.stringify(f);

export function BlogEditor({ initial, options }: { initial: EditorInitial; options: EditorOptions }) {
  const router = useRouter();
  const [fields, setFields] = useState<EditorFields>(initial.fields);
  const [id, setId] = useState(initial.id);
  const [status, setStatus] = useState<PostStatus>(initial.status);
  const [publishedAt, setPublishedAt] = useState(initial.publishedAt);
  const [liveSlug, setLiveSlug] = useState(initial.liveSlug);
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [savedAt, setSavedAt] = useState<Date | null>(initial.updatedAt ? new Date(initial.updatedAt) : null);
  const [slugError, setSlugError] = useState<string | null>(null);
  const [slugTouched, setSlugTouched] = useState(Boolean(initial.id));
  const [publishOpen, setPublishOpen] = useState(false);
  const [confirm, setConfirm] = useState<null | "delete" | "unpublish" | "archive">(null);
  const [tags, setTags] = useState(options.tags);

  const updatedAtRef = useRef(initial.updatedAt);
  const savedRef = useRef(serialize(initial.fields));
  const [savedSnap, setSavedSnap] = useState(() => serialize(initial.fields));
  const fieldsRef = useRef(fields);
  const idRef = useRef(id);
  const inFlight = useRef<Promise<unknown> | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    fieldsRef.current = fields;
    idRef.current = id;
  }, [fields, id]);

  const markSaved = useCallback((snap: string) => {
    savedRef.current = snap;
    setSavedSnap(snap);
  }, []);

  const create = useAction(createPostAction);
  const save = useAction(savePostAction);
  const setStatusAction = useAction(setPostStatusAction);
  const remove = useAction(deletePostAction);

  const shown = effectiveStatus(status, publishedAt);
  const live = status === "published" || status === "scheduled";
  const dirty = serialize(fields) !== savedSnap;
  const words = useMemo(() => countWords(fields.body), [fields.body]);
  const minutes = useMemo(() => readingMinutesFor(fields.body), [fields.body]);
  const issues = useMemo(() => publishIssues({ ...fields, coverKey: fields.coverKey, coverAlt: fields.coverAlt, seoDescription: fields.seoDescription }), [fields]);
  const category = options.categories.find((c) => c.id === fields.categoryId) ?? null;

  const update = useCallback(<K extends keyof EditorFields>(key: K, value: EditorFields[K]) => {
    setFields((prev) => {
      const next = { ...prev, [key]: value };
      if (key === "title" && !slugTouched && !liveSlug) next.slug = slugify(String(value));
      return next;
    });
  }, [slugTouched, liveSlug]);

  const persist = useCallback(
    async ({ force = false, publishLive = false }: { force?: boolean; publishLive?: boolean } = {}) => {
      if (inFlight.current) await inFlight.current.catch(() => null);
      const snapshot = fieldsRef.current;
      const snap = serialize(snapshot);
      if (snap === savedRef.current && !publishLive && !force) return true;
      if (!idRef.current) {
        if (!snapshot.title.trim() && !snapshot.body.trim()) return true;
        setSaveState("saving");
        const run = create.executeAsync({ fields: snapshot });
        inFlight.current = run;
        const result = await run.finally(() => (inFlight.current = null));
        if (!result?.data) {
          setSaveState("error");
          toast.error(result?.serverError ?? "Couldn't save the draft.");
          return false;
        }
        const newId = result.data.id;
        idRef.current = newId;
        setId(newId);
        updatedAtRef.current = result.data.updatedAt;
        const serverSlug = result.data.slug;
        const merged = { ...snapshot, slug: serverSlug };
        markSaved(serialize(merged));
        if (fieldsRef.current.slug !== serverSlug) setFields((prev) => ({ ...prev, slug: serverSlug }));
        setSlugTouched(true);
        setSavedAt(new Date(result.data.updatedAt));
        setSaveState("saved");
        window.history.replaceState(null, "", `/admin/blog/${newId}`);
        return true;
      }
      setSaveState("saving");
      const run = save.executeAsync({ id: idRef.current, fields: snapshot, expectedUpdatedAt: updatedAtRef.current ?? new Date(0).toISOString(), force, publishLive });
      inFlight.current = run;
      const result = await run.finally(() => (inFlight.current = null));
      if (!result?.data) {
        setSaveState("error");
        toast.error(result?.serverError ?? (result?.validationErrors ? "Some fields aren't valid. Check the canonical URL and cover image." : "Couldn't save. Check your connection."));
        return false;
      }
      if (result.data.conflict) {
        setSaveState("conflict");
        return false;
      }
      updatedAtRef.current = result.data.updatedAt;
      setSavedAt(new Date(result.data.updatedAt));
      setSlugError(result.data.slugError);
      const saved = result.data.slugError ? { ...snapshot, slug: result.data.slug } : snapshot;
      markSaved(serialize(saved));
      if (publishLive) setLiveSlug(result.data.slug);
      setSaveState("saved");
      return true;
    },
    [create, save, markSaved],
  );

  useEffect(() => {
    if (saveState === "conflict" || !dirty || live) return;
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => void persist(), 1200);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [fields, dirty, live, persist, saveState]);

  useEffect(() => {
    const onUnload = (e: BeforeUnloadEvent) => {
      if (serialize(fieldsRef.current) !== savedRef.current) e.preventDefault();
    };
    window.addEventListener("beforeunload", onUnload);
    return () => window.removeEventListener("beforeunload", onUnload);
  }, []);

  const saveNow = useCallback(async () => {
    if (live) {
      const ok = await persist({ publishLive: true });
      if (ok) toast("Changes are live");
      return ok;
    }
    return persist();
  }, [live, persist]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "s") {
        e.preventDefault();
        void saveNow();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [saveNow]);

  const runStatus = async (input: { op: "publish" } | { op: "schedule"; at: string } | { op: "unpublish" } | { op: "archive" } | { op: "restore" }) => {
    if (!(await persist())) return false;
    if (!idRef.current) return false;
    const result = await setStatusAction.executeAsync({ id: idRef.current, ...input } as Parameters<typeof setStatusAction.executeAsync>[0]);
    if (!result?.data) {
      toast.error(result?.serverError ?? "Couldn't change the status.");
      return false;
    }
    setStatus(result.data.status);
    setPublishedAt(result.data.publishedAt);
    updatedAtRef.current = result.data.updatedAt;
    setSavedAt(new Date(result.data.updatedAt));
    setLiveSlug(result.data.status === "published" || result.data.status === "scheduled" ? fieldsRef.current.slug : null);
    const label =
      input.op === "publish" ? "Published" : input.op === "schedule" ? (new Date(input.at) <= new Date() ? "Published with an earlier date" : `Scheduled for ${dateTimeFmt.format(new Date(input.at))}`) : input.op === "unpublish" ? "Moved back to drafts" : input.op === "archive" ? "Archived" : "Restored to drafts";
    toast(label);
    router.refresh();
    return true;
  };

  const doDelete = async () => {
    if (!idRef.current) {
      router.push("/admin/blog");
      return;
    }
    const result = await remove.executeAsync({ id: idRef.current });
    if (!result?.data) return toast.error(result?.serverError ?? "Couldn't delete the draft.");
    markSaved(serialize(fieldsRef.current));
    toast("Draft deleted");
    router.push("/admin/blog");
  };

  const reload = () => {
    markSaved(serialize(fieldsRef.current));
    window.location.reload();
  };

  const indicator = (() => {
    if (saveState === "saving") return { icon: <Spinner size={14} />, text: "Saving…" };
    if (saveState === "error") return { icon: <Icon icon={errorIcon} size={16} className="text-error" />, text: "Not saved" };
    if (saveState === "conflict") return { icon: <Icon icon={errorIcon} size={16} className="text-error" />, text: "Changed elsewhere" };
    if (dirty) return { icon: null, text: live ? "Unpublished changes" : "Unsaved changes" };
    if (savedAt && id) return { icon: <Icon icon={checkIcon} size={16} />, text: `Saved ${timeFmt.format(savedAt)}` };
    return { icon: null, text: id ? "" : "New draft" };
  })();

  return (
    <div className="pb-16">
      <header className="sticky top-28 z-20 -mx-4 flex min-h-16 items-center gap-2 border-b border-outline-variant bg-surface px-2 medium:mx-0 medium:px-0">
        <IconButton icon={arrowBackIcon} label="All posts" onClick={() => router.push("/admin/blog")} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-title-md text-on-surface">{fields.title.trim() || "Untitled post"}</p>
          <div className="flex items-center gap-2 text-body-sm text-on-surface-variant">
            <PostStatusChip status={shown} className="h-5" />
            <span className="inline-flex min-w-0 items-center gap-1 truncate" role="status" aria-live="polite">
              {indicator.icon}
              {indicator.text}
            </span>
          </div>
        </div>
        {id && (
          <Button asChild variant="text" className="hidden medium:inline-flex">
            <a href={`/blog/preview/${id}`} target="_blank" rel="noreferrer">
              <Icon icon={visibilityIcon} size={18} />
              Preview
            </a>
          </Button>
        )}
        {live ? (
          <Button onClick={() => void saveNow()} disabled={!dirty || saveState === "saving"} loading={saveState === "saving" && dirty}>
            Update
          </Button>
        ) : (
          <Button onClick={() => setPublishOpen(true)} disabled={status === "archived"}>
            Publish
          </Button>
        )}
        <Menu.Root modal={false}>
          <Menu.Trigger asChild>
            <IconButton icon={moreVertIcon} label="More actions" />
          </Menu.Trigger>
          <Menu.Portal>
            <Menu.Content align="end" sideOffset={4} className={menuClass}>
              {id && (
                <Menu.Item className={cn(itemClass, "medium:hidden")} asChild>
                  <a href={`/blog/preview/${id}`} target="_blank" rel="noreferrer">
                    <Icon icon={visibilityIcon} size={20} className="text-on-surface-variant" />
                    Preview
                  </a>
                </Menu.Item>
              )}
              {shown === "published" && liveSlug && (
                <Menu.Item className={itemClass} asChild>
                  <a href={`/blog/${liveSlug}`} target="_blank" rel="noreferrer">
                    <Icon icon={openInNewIcon} size={20} className="text-on-surface-variant" />
                    View on site
                  </a>
                </Menu.Item>
              )}
              {live && (
                <Menu.Item className={itemClass} onSelect={() => setPublishOpen(true)}>
                  <Icon icon={scheduleIcon} size={20} className="text-on-surface-variant" />
                  {status === "scheduled" ? "Change schedule" : "Change publish date"}
                </Menu.Item>
              )}
              {live && (
                <Menu.Item className={itemClass} onSelect={() => setConfirm("unpublish")}>
                  <Icon icon={publicOffIcon} size={20} className="text-on-surface-variant" />
                  Unpublish
                </Menu.Item>
              )}
              {id && status !== "archived" && (
                <Menu.Item className={itemClass} onSelect={() => setConfirm("archive")}>
                  <Icon icon={archiveIcon} size={20} className="text-on-surface-variant" />
                  Archive
                </Menu.Item>
              )}
              {status === "archived" && (
                <Menu.Item className={itemClass} onSelect={() => void runStatus({ op: "restore" })}>
                  <Icon icon={unarchiveIcon} size={20} className="text-on-surface-variant" />
                  Restore to drafts
                </Menu.Item>
              )}
              <Menu.Separator className="my-2 h-px bg-outline-variant" />
              <Menu.Item className={cn(itemClass, "text-error")} disabled={status !== "draft"} onSelect={() => setConfirm("delete")}>
                <Icon icon={deleteIcon} size={20} />
                Delete draft
              </Menu.Item>
            </Menu.Content>
          </Menu.Portal>
        </Menu.Root>
      </header>

      {saveState === "conflict" && (
        <div role="alert" className="mt-4 flex flex-col gap-3 rounded-md bg-error-container px-4 py-3 text-on-error-container medium:flex-row medium:items-center">
          <p className="flex-1 text-body-md">Someone changed this post in another tab or session. Reload to see their version, or keep yours and overwrite it.</p>
          <div className="flex gap-2">
            <Button variant="text" onClick={reload} className="text-on-error-container">
              Reload
            </Button>
            <Button variant="danger" onClick={() => void persist({ force: true, publishLive: live })}>
              Keep mine
            </Button>
          </div>
        </div>
      )}

      <div className="mt-6 grid grid-cols-1 gap-8 large:grid-cols-[minmax(0,1fr)_360px] xlarge:grid-cols-[minmax(0,1fr)_400px]">
        <BodyEditor
          postId={id}
          title={fields.title}
          excerpt={fields.excerpt}
          body={fields.body}
          categoryName={category?.name ?? null}
          words={words}
          minutes={minutes}
          options={options}
          onTitle={(v) => update("title", v)}
          onBody={(v) => update("body", v)}
          onSeo={(seoTitle, seoDescription) => setFields((prev) => ({ ...prev, seoTitle, seoDescription }))}
          seo={{ seoTitle: fields.seoTitle, seoDescription: fields.seoDescription }}
          faq={fields.faq}
          onFaq={(faq) => update("faq", faq)}
        />
        <SettingsPanel
          postId={id}
          fields={fields}
          update={update}
          options={{ ...options, tags }}
          onTagCreated={(t) => setTags((prev) => [...prev.filter((x) => x.id !== t.id), t].sort((a, b) => a.name.localeCompare(b.name)))}
          liveSlug={liveSlug}
          slugError={slugError}
          onSlugTouched={() => setSlugTouched(true)}
          issues={issues}
          status={shown}
          publishedAt={publishedAt}
          authorName={initial.authorName}
        />
      </div>

      <PublishDialog
        key={`${status}-${publishedAt ?? ""}`}
        open={publishOpen}
        onOpenChange={setPublishOpen}
        issues={issues}
        status={status}
        publishedAt={publishedAt}
        onPublish={async (input) => {
          const ok = await runStatus(input);
          if (ok) setPublishOpen(false);
        }}
        busy={setStatusAction.isPending || saveState === "saving"}
      />

      <Dialog
        open={confirm !== null}
        onOpenChange={(o) => !o && setConfirm(null)}
        title={confirm === "delete" ? "Delete this draft?" : confirm === "unpublish" ? "Unpublish this post?" : "Archive this post?"}
        description={
          confirm === "delete"
            ? "The draft and its settings are removed for good. Uploaded images stay in storage."
            : confirm === "unpublish"
              ? "It disappears from the blog, category pages and sitemap, and moves back to drafts. Links to it will show a not-found page."
              : "It's hidden from the blog and kept out of your drafts list. You can restore it later."
        }
        actions={
          <>
            <Button variant="text" onClick={() => setConfirm(null)}>
              Cancel
            </Button>
            <Button
              variant={confirm === "delete" ? "danger" : "filled"}
              loading={remove.isPending || setStatusAction.isPending}
              onClick={async () => {
                const which = confirm;
                setConfirm(null);
                if (which === "delete") await doDelete();
                else if (which === "unpublish") await runStatus({ op: "unpublish" });
                else if (which === "archive") await runStatus({ op: "archive" });
              }}
            >
              {confirm === "delete" ? "Delete" : confirm === "unpublish" ? "Unpublish" : "Archive"}
            </Button>
          </>
        }
      />
    </div>
  );
}
