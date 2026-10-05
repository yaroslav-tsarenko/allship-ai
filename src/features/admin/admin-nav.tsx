"use client";

import { usePathname } from "next/navigation";
import { LinkTabs } from "@/components/ui/tabs";

const sections = [
  { href: "/admin", label: "Overview", exact: true },
  { href: "/admin/carriers", label: "Carriers" },
  { href: "/admin/loads", label: "Loads" },
  { href: "/admin/disputes", label: "Disputes" },
  { href: "/admin/payments", label: "Payments" },
  { href: "/admin/leads", label: "Leads" },
  { href: "/admin/emails", label: "Emails" },
  { href: "/admin/blog", label: "Blog" },
  { href: "/admin/showcase", label: "Reviews" },
  { href: "/admin/users", label: "Users" },
];

export function AdminNav({ queueCount, disputeCount = 0 }: { queueCount: number; disputeCount?: number }) {
  const pathname = usePathname();
  const items = sections.map((s) => ({
    href: s.href,
    label: s.label,
    count: s.href === "/admin/carriers" ? queueCount : s.href === "/admin/disputes" ? disputeCount : undefined,
    active: s.exact ? pathname === s.href : pathname === s.href || pathname.startsWith(`${s.href}/`),
  }));
  return (
    <div className="sticky top-16 z-30 -mx-4 bg-surface px-4 medium:mx-0 medium:px-0">
      <LinkTabs items={items} label="Admin sections" />
    </div>
  );
}
