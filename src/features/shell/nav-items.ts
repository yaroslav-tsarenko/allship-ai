import {
  adminPanelSettingsIcon,
  chatIcon,
  gavelIcon,
  groupIcon,
  homeIcon,
  inventory2Icon,
  paymentsIcon,
  personPinCircleIcon,
  routeIcon,
  searchIcon,
  settingsIcon,
  starIcon,
  type IconData,
} from "@/components/ui/icons.generated";
import type { ViewerRole } from "@/server/viewer/viewer";

export type NavItem = { href: string; label: string; icon: IconData; exact?: boolean; badge?: "messages" };

const home: NavItem = { href: "/app", label: "Home", icon: homeIcon, exact: true };
const loads: NavItem = { href: "/app/loads", label: "Loads", icon: inventory2Icon };
const findLoads: NavItem = { href: "/app/board", label: "Find loads", icon: searchIcon };
const bids: NavItem = { href: "/app/bids", label: "Bids", icon: gavelIcon };
const trips: NavItem = { href: "/app/trips", label: "Trips", icon: routeIcon };
const fleet: NavItem = { href: "/app/fleet", label: "Fleet", icon: personPinCircleIcon };
const team: NavItem = { href: "/app/team", label: "Team", icon: groupIcon };
const messages: NavItem = { href: "/app/messages", label: "Messages", icon: chatIcon, badge: "messages" };
const payouts: NavItem = { href: "/app/payouts", label: "Payouts", icon: paymentsIcon };
const reviews: NavItem = { href: "/app/reviews", label: "Reviews", icon: starIcon };
const settings: NavItem = { href: "/app/settings", label: "Settings", icon: settingsIcon };
const admin: NavItem = { href: "/admin", label: "Admin", icon: adminPanelSettingsIcon };

const byRole: Record<ViewerRole, NavItem[]> = {
  shipper: [home, loads, messages, settings],
  owner: [home, findLoads, bids, trips, fleet, team, messages, payouts, reviews, settings],
  dispatcher: [home, findLoads, bids, trips, fleet, messages, reviews, settings],
  driver: [home, trips, messages, settings],
};

export function navItemsFor(role: ViewerRole, isAdmin: boolean): NavItem[] {
  return isAdmin ? [...byRole[role], admin] : byRole[role];
}

export function barItemsFor(items: NavItem[]): { primary: NavItem[]; overflow: NavItem[] } {
  if (items.length <= 5) return { primary: items, overflow: [] };
  return { primary: items.slice(0, 4), overflow: items.slice(4) };
}

export const roleLabels: Record<ViewerRole, string> = {
  shipper: "Shipper",
  owner: "Carrier owner",
  dispatcher: "Dispatcher",
  driver: "Driver",
};
