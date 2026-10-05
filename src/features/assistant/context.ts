import type { PageContext } from "@/server/ai/types";
import type { ViewerRole } from "@/server/viewer/viewer";

const detailPattern = /^\/app\/(loads|board|trips)\/(AS-[A-Z0-9]{4,10})(?:\/|$)/;

export function pageContextFor(pathname: string, title?: string): PageContext {
  const path = pathname.replace(/[^\w\-/]/g, "").slice(0, 200) || "/app";
  const publicId = path.match(detailPattern)?.[2];
  const cleanTitle = title
    ?.replace(/\s*[|·–-]\s*AllShip.*$/i, "")
    .trim()
    .slice(0, 120);
  return { path, ...(cleanTitle ? { title: cleanTitle } : {}), ...(publicId ? { publicId } : {}) };
}

export type Suggestion = { label: string; prompt: string };

export function suggestionsFor(role: ViewerRole, page: PageContext): Suggestion[] {
  const id = page.publicId;
  const tour: Suggestion = { label: "Show me around", prompt: "Show me around" };
  if (role === "shipper") {
    if (id && page.path.startsWith("/app/loads/"))
      return [
        {
          label: `Compare the bids on ${id}`,
          prompt: `Compare the bids on ${id} and tell me which one you'd pick.`,
        },
        { label: "When will it arrive?", prompt: `When will ${id} arrive?` },
        { label: "How does escrow work?", prompt: "How does escrow work?" },
        tour,
      ];
    if (page.path.startsWith("/app/loads/new"))
      return [
        { label: "Ship my car from Dallas to Denver", prompt: "I need to ship my car from Dallas to Denver" },
        {
          label: "What does it cost to move a 2-bedroom?",
          prompt: "Roughly what does it cost to move a 2-bedroom apartment 900 miles?",
        },
        tour,
      ];
    return [
      { label: "How are my loads doing?", prompt: "How are my loads doing?" },
      { label: "Ship my car from Dallas to Denver", prompt: "I need to ship my car from Dallas to Denver" },
      { label: "What are the fees?", prompt: "What fees does AllShip charge?" },
      tour,
    ];
  }
  if (role === "driver") {
    if (id)
      return [
        { label: "What do I do at pickup?", prompt: `What do I need to do at pickup for ${id}?` },
        { label: "What's my next stop?", prompt: "What's my next stop?" },
        tour,
      ];
    return [
      { label: "What's my next stop?", prompt: "What's my next stop?" },
      { label: "How do I confirm delivery?", prompt: "How do I confirm a delivery?" },
      tour,
    ];
  }
  if (id && page.path.startsWith("/app/board/"))
    return [
      { label: `Draft a bid on ${id}`, prompt: `Draft a bid on ${id}` },
      { label: "Is this load a good fit?", prompt: `Is ${id} a good fit for us?` },
      { label: "Find similar loads", prompt: "Find more loads like this one" },
      tour,
    ];
  return [
    { label: "Find car loads from Texas", prompt: "Find car loads from Texas" },
    { label: "Which trips need a driver?", prompt: "Which upcoming trips still need a driver assigned?" },
    { label: "When do I get paid?", prompt: "When do I get paid for a load?" },
    tour,
  ];
}

export function loadHrefFor(role: ViewerRole, publicId: string) {
  if (role === "shipper") return `/app/loads/${publicId}`;
  if (role === "driver") return `/app/trips/${publicId}`;
  return `/app/board/${publicId}`;
}
