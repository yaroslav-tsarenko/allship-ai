import { Icon } from "@/components/ui/icon";
import { arrowBackIcon, attachFileIcon, chatIcon, sendIcon } from "@/components/ui/icons.generated";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/cn";
import { defineScene } from "../define";
import { CarCarrier } from "../illustrations/car-carrier";
import type { SceneViewProps } from "../types";
import { demoLoad } from "./data";
import { AppShell, Avatar, Caret } from "./kit";

type S = { open: boolean; input: string; count: number; sending: boolean; typing: boolean };

type Msg = { mine: boolean; body?: string; photo?: boolean; at: string };

const messages: Msg[] = [
  {
    mine: false,
    body: "Hi Emily, Marcus can pick up Tuesday between 8 and 10 AM. Is there a gate code?",
    at: "9:12 AM",
  },
  {
    mine: true,
    body: "Tuesday works. Gate code is 4471. Please park on the street, the driveway is narrow.",
    at: "9:14 AM",
  },
  { mine: false, photo: true, at: "8:21 AM" },
  { mine: false, body: "Loaded and strapped. Heading to Denver now.", at: "8:21 AM" },
];

const reply = messages[1]!.body!;

const conversations = [
  { name: "Lone Star Auto Haul", load: demoLoad.publicId, preview: "Is there a gate code?", time: "9:12 AM" },
  { name: "Hill Country Movers", load: "AS-3HV8LC", preview: "We'll bring 2 extra blankets.", time: "Mon" },
  { name: "Front Range Carriers", load: "AS-9D4M2X", preview: "Thanks, see you Friday.", time: "Oct 2" },
];

function List({ s }: { s: S }) {
  return (
    <ul className="flex flex-col py-2">
      {conversations.map((c, i) => {
        const active = i === 0 && s.open;
        const unread = i === 0 && !s.open;
        return (
          <li key={c.name}>
            <div
              data-demo={i === 0 ? "conversation" : undefined}
              className={cn(
                "state-layer mx-2 flex items-center gap-3 rounded-full px-3 py-3",
                active && "bg-secondary-container",
              )}
            >
              <Avatar name={c.name} size={40} tone={i} />
              <span className="min-w-0 flex-1">
                <span className="flex items-baseline gap-2">
                  <span className={cn("text-body-lg min-w-0 flex-1 truncate", unread && "font-semibold")}>
                    {c.name}
                  </span>
                  <span
                    className={cn(
                      "text-label-md shrink-0",
                      unread ? "text-primary font-semibold" : "text-on-surface-variant",
                    )}
                  >
                    {c.time}
                  </span>
                </span>
                <span className="flex items-center gap-2">
                  <span
                    className={cn(
                      "text-body-md min-w-0 flex-1 truncate",
                      unread ? "text-on-surface font-medium" : "text-on-surface-variant",
                    )}
                  >
                    {c.load} · {c.preview}
                  </span>
                  {unread && (
                    <span className="bg-primary text-label-sm text-on-primary flex h-5 min-w-5 items-center justify-center rounded-full px-1.5">
                      1
                    </span>
                  )}
                </span>
              </span>
            </div>
          </li>
        );
      })}
    </ul>
  );
}

function Thread({ s, focus }: { s: S; focus: string | null }) {
  const shown = messages.slice(0, s.count);
  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="border-outline-variant flex h-16 shrink-0 items-center gap-3 border-b px-3 @3xl:px-5">
        <span className="text-on-surface-variant inline-flex size-10 items-center justify-center rounded-full @5xl:hidden">
          <Icon icon={arrowBackIcon} />
        </span>
        <Avatar name="Lone Star Auto Haul" size={36} tone={0} />
        <span className="min-w-0">
          <span className="text-title-md text-on-surface block truncate">Lone Star Auto Haul</span>
          <span className="text-body-sm text-on-surface-variant block truncate">
            {demoLoad.publicId} · {demoLoad.title}
          </span>
        </span>
      </div>
      <div
        data-demo-scroll="thread"
        className="flex min-h-0 flex-1 flex-col justify-end overflow-hidden px-3 pb-3 @3xl:px-6"
      >
        <ol className="flex flex-col">
          {shown.map((m, i) => {
            const prev = shown[i - 1];
            const joinsPrev = prev && prev.mine === m.mine;
            const sending = m.mine && s.sending && i === shown.length - 1;
            return (
              <li key={i} className={cn("animate-message-in flex flex-col", joinsPrev ? "mt-0.5" : "mt-3")}>
                {i === 2 && (
                  <div className="my-3 flex justify-center">
                    <span className="text-label-md text-on-surface-variant font-medium">Today</span>
                  </div>
                )}
                <div className={cn("flex items-end gap-2", m.mine ? "justify-end" : "justify-start")}>
                  {!m.mine && (
                    <span className={cn(joinsPrev && i !== 2 && "invisible")}>
                      {<Avatar name="Lone Star" size={32} tone={0} />}
                    </span>
                  )}
                  <div
                    className={cn(
                      "flex max-w-[min(80%,520px)] min-w-0 flex-col gap-1",
                      m.mine ? "items-end" : "items-start",
                    )}
                  >
                    {m.photo ? (
                      <div
                        data-demo="photo"
                        className="bg-tertiary-container text-on-tertiary-container relative h-48 w-60 overflow-hidden rounded-[18px]"
                      >
                        <CarCarrier className="absolute inset-x-4 bottom-6 h-auto w-[calc(100%-32px)]" />
                        <span className="bg-scrim/50 text-label-sm absolute top-2 left-2 rounded-xs px-1.5 py-0.5 text-white">
                          Photo
                        </span>
                      </div>
                    ) : (
                      <div
                        className={cn(
                          "text-body-lg rounded-[20px] px-4 py-2.5",
                          m.mine
                            ? "bg-primary-container text-on-primary-container"
                            : "bg-surface-container-highest text-on-surface",
                        )}
                      >
                        {m.body}
                      </div>
                    )}
                  </div>
                </div>
                {(!shown[i + 1] || shown[i + 1]!.mine !== m.mine) && (
                  <span
                    className={cn(
                      "text-label-md text-on-surface-variant mt-1",
                      m.mine ? "self-end" : "ml-10",
                    )}
                  >
                    {sending ? (
                      <span className="inline-flex items-center gap-1.5">
                        <Spinner size={12} />
                        Sending…
                      </span>
                    ) : (
                      m.at
                    )}
                  </span>
                )}
              </li>
            );
          })}
          {s.typing && (
            <li className="animate-message-in mt-3 ml-10 flex">
              <span className="bg-surface-container-highest flex gap-1 rounded-[20px] px-4 py-3.5">
                {[0, 1, 2].map((d) => (
                  <span
                    key={d}
                    className="bg-on-surface-variant size-2 animate-pulse rounded-full"
                    style={{ animationDelay: `${d * 160}ms` }}
                  />
                ))}
              </span>
            </li>
          )}
        </ol>
      </div>
      <div className="shrink-0 px-3 pb-3 @3xl:px-6">
        <div className="bg-surface-container-highest flex items-end gap-1 rounded-[24px] py-1 pr-1 pl-2">
          <span className="text-on-surface-variant inline-flex size-10 shrink-0 items-center justify-center rounded-full">
            <Icon icon={attachFileIcon} size={22} />
          </span>
          <span
            data-demo="composer"
            className={cn(
              "text-body-lg min-h-10 flex-1 truncate py-2",
              s.input ? "text-on-surface" : "text-on-surface-variant",
            )}
          >
            {s.input || (focus === "composer" ? "" : "Message")}
            {focus === "composer" && <Caret />}
          </span>
          <span
            data-demo="send"
            className={cn(
              "state-layer inline-flex size-10 shrink-0 items-center justify-center rounded-full",
              s.input ? "bg-primary text-on-primary" : "text-on-surface/38",
            )}
          >
            <Icon icon={sendIcon} size={20} />
          </span>
        </div>
      </div>
    </div>
  );
}

function View({ s, focus }: SceneViewProps<S>) {
  return (
    <AppShell role="shipper" active="messages" unread={s.open ? 0 : 1}>
      <div className="flex h-full min-h-0 @3xl:pr-6">
        <div
          className={cn(
            "border-outline-variant w-full shrink-0 @5xl:block @5xl:w-[340px] @5xl:border-r",
            s.open && "hidden",
          )}
        >
          <h2 className="text-headline-sm text-on-surface px-4 pt-3 pb-1">Messages</h2>
          <List s={s} />
        </div>
        <div className={cn("min-w-0 flex-1", !s.open && "hidden @5xl:block")}>
          {s.open ? (
            <Thread s={s} focus={focus} />
          ) : (
            <div className="text-on-surface-variant flex h-full flex-col items-center justify-center gap-2">
              <Icon icon={chatIcon} size={32} />
              <p className="text-body-md">Choose a conversation</p>
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}

export const chat = defineScene<S>({
  id: "chat",
  title: "Messages",
  summary:
    "Shipper and carrier settle pickup details in the load's own thread, and the driver shares a photo from pickup.",
  url: (s) => (s.open ? "/app/messages/lone-star-as-7k2p9q" : "/app/messages"),
  device: "desktop",
  initial: { open: false, input: "", count: 1, sending: false, typing: false },
  View,
  script: ({ caption, click, type, set, wait, highlight }) => [
    caption("Every load has its own thread with the carrier"),
    click("conversation", { open: true }),
    wait(700),
    caption("Answer access questions in seconds"),
    type("composer", reply, { key: "input", ms: 32 }),
    click("send", { input: "", count: 2, sending: true }),
    wait(600),
    set({ sending: false }),
    wait(900),
    caption("Drivers share photos from the road"),
    set({ typing: true }),
    wait(1100),
    set({ typing: false, count: 3 }),
    wait(500),
    set({ count: 4 }),
    highlight("photo", "Pickup photos also land on the trip timeline"),
    wait(1200),
  ],
});
