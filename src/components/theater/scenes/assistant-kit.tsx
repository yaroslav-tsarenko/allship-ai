import { Fragment, type ReactNode } from "react";
import { Icon } from "@/components/ui/icon";
import { arrowUpwardIcon, checkIcon, closeIcon, infoIcon } from "@/components/ui/icons.generated";
import { cn } from "@/lib/cn";
import { Caret, SparkGlyph } from "./kit";

export type ChatState = { input: string; sent: boolean; tools: number; answer: string };

export function Rich({ text }: { text: string }) {
  return (
    <div className="text-body-lg text-on-surface flex flex-col gap-3">
      {text.split("\n\n").map((para, i) => (
        <p key={i}>
          {para.split("**").map((part, j) =>
            j % 2 === 1 ? (
              <strong key={j} className="font-medium">
                {part}
              </strong>
            ) : (
              <Fragment key={j}>{part}</Fragment>
            ),
          )}
        </p>
      ))}
    </div>
  );
}

export function AssistantPanel({
  s,
  focus,
  greeting,
  suggestions,
  question,
  tools,
  full,
  subtitle,
  children,
}: {
  s: ChatState;
  focus: string | null;
  greeting: string;
  suggestions: string[];
  question: string;
  tools: string[];
  full: string;
  subtitle: string;
  children?: ReactNode;
}) {
  const streaming = s.sent && s.answer.length < full.length;
  return (
    <div className="bg-surface-container-low flex h-full flex-col">
      <div className="flex h-14 shrink-0 items-center gap-2 pr-2 pl-4">
        <SparkGlyph size={22} className="text-primary" />
        <div className="min-w-0 flex-1">
          <p className="text-title-md text-on-surface truncate">AllShip AI</p>
          {s.sent && <p className="text-body-sm text-on-surface-variant truncate">{subtitle}</p>}
        </div>
        <span className="text-on-surface-variant inline-flex size-10 items-center justify-center rounded-full">
          <Icon icon={closeIcon} />
        </span>
      </div>
      <div className="min-h-0 flex-1 overflow-hidden px-4">
        {!s.sent ? (
          <div className="flex h-full flex-col justify-end gap-5 pb-4">
            <div>
              <SparkGlyph size={30} className="text-primary mb-3" />
              <p className="text-headline-sm text-on-surface">{greeting}</p>
              <p className="text-body-lg text-on-surface-variant mt-1">
                Ask about your loads, bids or how something works.
              </p>
            </div>
            <div className="flex flex-col items-start gap-2">
              {suggestions.map((t) => (
                <span
                  key={t}
                  className="border-outline-variant text-label-lg text-on-surface inline-flex min-h-10 items-center rounded-sm border px-4 py-2 font-medium"
                >
                  {t}
                </span>
              ))}
            </div>
          </div>
        ) : (
          <ol className="flex flex-col gap-6 py-4">
            <li className="animate-message-in flex justify-end pl-10">
              <p className="bg-surface-container-highest text-body-lg text-on-surface rounded-[20px] rounded-br-xs px-4 py-2.5">
                {question}
              </p>
            </li>
            <li className="flex gap-3">
              <SparkGlyph
                size={22}
                className={cn("text-primary mt-0.5 shrink-0", streaming && "animate-spin [animation-duration:2.4s]")}
              />
              <div className="flex min-w-0 flex-1 flex-col gap-3">
                <ul className="flex flex-col gap-1">
                  {tools.slice(0, s.tools).map((t) => (
                    <li key={t} className="text-body-md text-on-surface-variant animate-message-in flex items-center gap-2">
                      <Icon icon={checkIcon} size={16} className="text-on-surface-variant/70" />
                      {t}
                    </li>
                  ))}
                </ul>
                {s.tools > 0 && !s.answer && <p className="text-body-md text-on-surface-variant animate-pulse">Thinking…</p>}
                {s.answer && <Rich text={s.answer} />}
                {children}
              </div>
            </li>
          </ol>
        )}
      </div>
      <div className="shrink-0 px-3 pt-2 pb-3">
        <div className="bg-surface-container-highest flex items-end gap-1 rounded-[24px] py-1 pr-1 pl-4">
          <span
            data-demo="composer"
            className={cn("text-body-lg min-h-10 flex-1 truncate py-2", s.input ? "text-on-surface" : "text-on-surface-variant")}
          >
            {s.input || (focus === "composer" ? "" : "Ask AllShip AI")}
            {focus === "composer" && <Caret />}
          </span>
          <span
            data-demo="send"
            className={cn(
              "state-layer inline-flex size-10 shrink-0 items-center justify-center rounded-full",
              s.input ? "bg-primary text-on-primary" : "text-on-surface/38",
            )}
          >
            <Icon icon={arrowUpwardIcon} size={20} />
          </span>
        </div>
        <p className="text-body-sm text-on-surface-variant flex items-center gap-1.5 px-2 pt-1.5">
          <Icon icon={infoIcon} size={14} />
          It suggests. You confirm every action.
        </p>
      </div>
    </div>
  );
}

export function DockedAssistant({ open, panel }: { open: boolean; panel: ReactNode }) {
  return (
    <div
      className={cn(
        "border-outline-variant hidden w-[400px] shrink-0 border-l transition-[margin] duration-500 ease-[cubic-bezier(0.2,0,0,1)] @5xl:block",
        !open && "-mr-[400px]",
      )}
    >
      {panel}
    </div>
  );
}

export function SheetAssistant({ open, panel }: { open: boolean; panel: ReactNode }) {
  return (
    <div
      className={cn(
        "absolute inset-0 z-20 transition-transform duration-500 ease-[cubic-bezier(0.2,0,0,1)] @5xl:hidden",
        open ? "translate-y-0" : "translate-y-full",
      )}
    >
      {panel}
    </div>
  );
}

export function AiFilledNote() {
  return (
    <div
      data-demo="ai-note"
      className="animate-enter bg-primary-container text-on-primary-container flex items-center gap-3 rounded-md py-2.5 pr-2 pl-3"
    >
      <SparkGlyph size={20} className="shrink-0" />
      <p className="text-body-md min-w-0 flex-1">Filled in by AllShip AI. Review before posting.</p>
      <Icon icon={closeIcon} size={20} />
    </div>
  );
}
