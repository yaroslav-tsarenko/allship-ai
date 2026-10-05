import "server-only";
import { and, eq } from "drizzle-orm";
import { db } from "@/server/db/client";
import { account } from "@/server/db/schema";
import { WelcomeBanner } from "./welcome-banner";

export async function WelcomeNotice({ userId, count, open }: { userId: string; count: string; open: boolean }) {
  const [credential] = await db
    .select({ id: account.id })
    .from(account)
    .where(and(eq(account.userId, userId), eq(account.providerId, "credential")))
    .limit(1);
  const n = Math.min(Math.max(Number.parseInt(count, 10) || 1, 1), 20);
  return <WelcomeBanner count={n} needsPassword={!credential} open={open} />;
}
