import {
  chatIcon,
  flagIcon,
  gavelIcon,
  handshakeIcon,
  localShippingIcon,
  notificationsIcon,
  paymentsIcon,
  starIcon,
  taskAltIcon,
  verifiedUserIcon,
  type IconData,
} from "@/components/ui/icons.generated";

const icons: Record<string, IconData> = {
  message: chatIcon,
  bid_received: gavelIcon,
  instant_booking: gavelIcon,
  bid_won: gavelIcon,
  bid_declined: gavelIcon,
  load_booked: handshakeIcon,
  load_cancelled: flagIcon,
  trip_assigned: localShippingIcon,
  driver_assigned: localShippingIcon,
  trip_started: localShippingIcon,
  picked_up: localShippingIcon,
  delivered: taskAltIcon,
  completed: taskAltIcon,
  dispute_opened: flagIcon,
  dispute_resolved: flagIcon,
  payout_sent: paymentsIcon,
  review_received: starIcon,
  carrier_verification: verifiedUserIcon,
};

export function notificationIcon(type: string) {
  return icons[type] ?? notificationsIcon;
}

export function relativeTime(iso: string, now = Date.now()) {
  const diff = Math.max(0, now - new Date(iso).getTime());
  const minutes = Math.floor(diff / 60_000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hr`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} d`;
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function dayLabel(iso: string, now = new Date()) {
  const d = new Date(iso);
  const start = (x: Date) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime();
  const days = Math.round((start(now) - start(d)) / 86_400_000);
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7) return d.toLocaleDateString("en-US", { weekday: "long" });
  return d.toLocaleDateString("en-US", { month: "long", day: "numeric", year: d.getFullYear() === now.getFullYear() ? undefined : "numeric" });
}
