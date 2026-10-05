export const topics = {
  user: (userId: string) => `user:${userId}`,
  load: (loadId: string) => `load:${loadId}`,
  conversation: (conversationId: string) => `conv:${conversationId}`,
};

export type RealtimeEvent =
  | { event: "notification"; payload: { id: string; title: string; href: string | null } }
  | { event: "message"; payload: { id: string; conversationId: string; senderId: string } }
  | { event: "typing"; payload: { conversationId: string; userId: string; name: string } }
  | { event: "load_status"; payload: { loadId: string; status: string } }
  | { event: "location"; payload: { loadId: string; lat: number; lng: number; recordedAt: string; speedMph: number | null; headingDeg: number | null } };
