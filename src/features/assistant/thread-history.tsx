"use client";

import * as Dropdown from "@radix-ui/react-dropdown-menu";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { chatBubbleIcon, deleteIcon, editIcon, moreVertIcon } from "@/components/ui/icons.generated";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/cn";
import { deleteAiThreadAction, renameAiThreadAction } from "@/server/actions/ai";

export type ThreadSummary = { id: string; title: string; updatedAt: string };

function when(iso: string) {
  const d = new Date(iso);
  const days = Math.floor((Date.now() - d.getTime()) / 86_400_000);
  if (days < 1 && new Date().getDate() === d.getDate())
    return d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  if (days < 7) return d.toLocaleDateString("en-US", { weekday: "short" });
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

const menuItem =
  "state-layer flex h-12 cursor-pointer items-center gap-3 px-3 text-body-lg text-on-surface outline-none data-[highlighted]:bg-on-surface/8";

function Row({
  thread,
  active,
  onOpen,
  onRenamed,
  onDeleted,
}: {
  thread: ThreadSummary;
  active: boolean;
  onOpen: () => void;
  onRenamed: (title: string) => void;
  onDeleted: () => void;
}) {
  const [mode, setMode] = useState<"view" | "rename" | "delete">("view");
  const [draft, setDraft] = useState(thread.title);
  const [busy, setBusy] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const settled = useRef(false);

  useEffect(() => {
    if (mode === "rename") {
      settled.current = false;
      inputRef.current?.select();
    }
  }, [mode]);

  const save = async () => {
    if (settled.current) return;
    settled.current = true;
    const title = draft.trim();
    if (!title || title === thread.title) return setMode("view");
    setBusy(true);
    const res = await renameAiThreadAction({ threadId: thread.id, title }).catch(() => null);
    setBusy(false);
    if (res?.data?.ok) onRenamed(title);
    setMode("view");
  };

  const remove = async () => {
    setBusy(true);
    const res = await deleteAiThreadAction({ threadId: thread.id }).catch(() => null);
    setBusy(false);
    if (res?.data?.ok) onDeleted();
    else setMode("view");
  };

  if (mode === "rename") {
    return (
      <li className="px-2 py-1">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void save();
          }}
          className="bg-surface-container-highest flex items-center gap-2 rounded-sm px-3 py-1.5"
        >
          <input
            ref={inputRef}
            value={draft}
            maxLength={80}
            aria-label="Conversation name"
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Escape") {
                e.stopPropagation();
                settled.current = true;
                setDraft(thread.title);
                setMode("view");
              }
            }}
            onBlur={() => void save()}
            className="text-body-lg text-on-surface h-9 min-w-0 flex-1 bg-transparent outline-none"
          />
          {busy && <Spinner size={18} />}
        </form>
      </li>
    );
  }

  if (mode === "delete") {
    return (
      <li className="bg-error-container text-on-error-container mx-2 my-1 flex flex-col gap-2 rounded-sm p-3">
        <p className="text-body-md">
          Delete <span className="font-medium">{thread.title}</span>? This can&apos;t be undone.
        </p>
        <div className="flex justify-end gap-1">
          <Button
            variant="text"
            size="sm"
            className="text-on-error-container"
            onClick={() => setMode("view")}
            autoFocus
          >
            Cancel
          </Button>
          <Button variant="danger" size="sm" loading={busy} onClick={() => void remove()}>
            Delete
          </Button>
        </div>
      </li>
    );
  }

  return (
    <li className="group relative px-2">
      <button
        type="button"
        onClick={onOpen}
        aria-current={active ? "true" : undefined}
        className={cn(
          "state-layer flex w-full cursor-pointer items-center gap-3 rounded-full py-2.5 pr-12 pl-3 text-left",
          active ? "bg-secondary-container text-on-secondary-container" : "text-on-surface",
        )}
      >
        <Icon icon={chatBubbleIcon} size={20} className="text-on-surface-variant shrink-0" />
        <span className="text-body-lg min-w-0 flex-1 truncate">{thread.title}</span>
        <span className="text-label-md text-on-surface-variant shrink-0">{when(thread.updatedAt)}</span>
      </button>
      <Dropdown.Root>
        <Dropdown.Trigger
          aria-label={`Options for ${thread.title}`}
          className="state-layer text-on-surface-variant data-[state=open]:bg-on-surface/8 absolute top-1/2 right-3 inline-flex size-9 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full"
        >
          <Icon icon={moreVertIcon} size={20} />
        </Dropdown.Trigger>
        <Dropdown.Portal>
          <Dropdown.Content
            align="end"
            sideOffset={4}
            collisionPadding={8}
            onCloseAutoFocus={(e) => e.preventDefault()}
            className="bg-surface-container shadow-elevation-2 data-[state=closed]:animate-menu-out data-[state=open]:animate-menu-in z-[60] min-w-40 origin-(--radix-dropdown-menu-content-transform-origin) overflow-hidden rounded-xs py-2"
          >
            <Dropdown.Item className={menuItem} onSelect={() => setMode("rename")}>
              <Icon icon={editIcon} size={20} className="text-on-surface-variant" />
              Rename
            </Dropdown.Item>
            <Dropdown.Item className={menuItem} onSelect={() => setMode("delete")}>
              <Icon icon={deleteIcon} size={20} className="text-on-surface-variant" />
              Delete
            </Dropdown.Item>
          </Dropdown.Content>
        </Dropdown.Portal>
      </Dropdown.Root>
    </li>
  );
}

export function ThreadHistory({
  threads,
  activeId,
  onOpen,
  onRenamed,
  onDeleted,
}: {
  threads: ThreadSummary[] | null;
  activeId: string | null;
  onOpen: (id: string) => void;
  onRenamed: (id: string, title: string) => void;
  onDeleted: (id: string) => void;
}) {
  if (!threads)
    return (
      <div className="text-primary flex flex-1 items-center justify-center py-16">
        <Spinner />
      </div>
    );
  if (threads.length === 0)
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-1 px-8 py-16 text-center">
        <p className="text-title-md text-on-surface">No conversations yet</p>
        <p className="text-body-md text-on-surface-variant">Chats you start here show up in this list.</p>
      </div>
    );
  return (
    <div className="flex flex-col py-2">
      <h3 className="text-title-sm text-on-surface-variant px-5 pt-2 pb-2">Recent</h3>
      <ul className="flex flex-col gap-0.5">
        {threads.map((t) => (
          <Row
            key={t.id}
            thread={t}
            active={t.id === activeId}
            onOpen={() => onOpen(t.id)}
            onRenamed={(title) => onRenamed(t.id, title)}
            onDeleted={() => onDeleted(t.id)}
          />
        ))}
      </ul>
    </div>
  );
}
