import type { Metadata } from "next";
import { AdminNav } from "@/features/admin/admin-nav";
import { AppShell } from "@/features/shell/app-shell";
import { getOpenDisputeCount, getVerificationQueueCount } from "@/server/admin/queries";
import { requireAdmin } from "@/server/auth/session";
import { getViewer } from "@/server/viewer/viewer";

export const metadata: Metadata = { title: { default: "Admin", template: "%s · Admin · AllShip AI" }, robots: { index: false, follow: false } };

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin();
  const [viewer, queueCount, disputeCount] = await Promise.all([getViewer(), getVerificationQueueCount(), getOpenDisputeCount()]);
  return (
    <AppShell viewer={viewer}>
      <div className="mx-auto max-w-[1440px]">
        <AdminNav queueCount={queueCount} disputeCount={disputeCount} />
        <div className="pt-4">{children}</div>
      </div>
    </AppShell>
  );
}
