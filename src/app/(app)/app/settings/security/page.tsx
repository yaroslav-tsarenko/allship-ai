import { and, eq } from "drizzle-orm";
import type { Metadata } from "next";
import { PageHeader } from "@/components/ui/page-header";
import { SecurityPanel } from "@/features/settings/security-panel";
import { db } from "@/server/db/client";
import { account } from "@/server/db/schema";
import { getViewer } from "@/server/viewer/viewer";

export const metadata: Metadata = { title: "Security" };

export default async function SecurityPage({ searchParams }: { searchParams: Promise<{ require?: string }> }) {
  const viewer = await getViewer();
  const { require } = await searchParams;
  const [credential] = await db
    .select({ id: account.id })
    .from(account)
    .where(and(eq(account.userId, viewer.user.id), eq(account.providerId, "credential")))
    .limit(1);
  return (
    <div className="mx-auto max-w-[840px]">
      <PageHeader title="Security" description="Settings that help keep your account and payments safe." />
      <SecurityPanel
        twoFactorEnabled={Boolean(viewer.user.twoFactorEnabled)}
        hasPassword={Boolean(credential)}
        currentToken={viewer.session.session.token}
        requireTwoFactor={require === "2fa"}
      />
    </div>
  );
}
