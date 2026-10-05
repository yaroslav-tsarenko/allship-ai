export const tourIds = ["welcome-shipper", "post-load", "compare-bids", "welcome-carrier", "load-board", "place-bid", "team", "welcome-driver", "trip-driver", "assistant"] as const;

export type TourId = (typeof tourIds)[number];

export const tourMeta: Record<TourId, { title: string; path: string; roles: Array<"shipper" | "owner" | "dispatcher" | "driver"> }> = {
  "welcome-shipper": { title: "Get around your dashboard", path: "/app", roles: ["shipper"] },
  "post-load": { title: "Post your first load", path: "/app/loads/new", roles: ["shipper"] },
  "compare-bids": { title: "Compare bids and book", path: "/app/loads", roles: ["shipper"] },
  "welcome-carrier": { title: "Get around your dashboard", path: "/app", roles: ["owner", "dispatcher"] },
  "load-board": { title: "Find loads that fit your trucks", path: "/app/board", roles: ["owner", "dispatcher"] },
  "place-bid": { title: "Write a bid that wins", path: "/app/board", roles: ["owner", "dispatcher"] },
  team: { title: "Add drivers and dispatchers", path: "/app/team", roles: ["owner"] },
  "welcome-driver": { title: "Your trips at a glance", path: "/app/trips", roles: ["driver"] },
  "trip-driver": { title: "Run a trip step by step", path: "/app/trips", roles: ["driver"] },
  assistant: { title: "Meet your AI assistant", path: "/app", roles: ["shipper", "owner", "dispatcher", "driver"] },
};

export type TourRole = "shipper" | "owner" | "dispatcher" | "driver";

export function welcomeTourFor(role: TourRole): TourId {
  return role === "shipper" ? "welcome-shipper" : role === "driver" ? "welcome-driver" : "welcome-carrier";
}

export function toursFor(role: TourRole): TourId[] {
  return tourIds.filter((id) => tourMeta[id].roles.includes(role));
}

export function isTourId(value: unknown): value is TourId {
  return typeof value === "string" && (tourIds as readonly string[]).includes(value);
}
