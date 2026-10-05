import { NextResponse } from "next/server";
import { requestLogger } from "@/lib/log";
import { exportStream } from "@/server/account/export";
import { getSession } from "@/server/auth/session";
import { db } from "@/server/db/client";
import { auditLog } from "@/server/db/schema";
import { clientIp, consumeRateLimit } from "@/server/rate-limit";

const noStore = { "Cache-Control": "no-store, private", "X-Robots-Tag": "noindex" };

export async function GET(request: Request) {
  const session = await getSession();
  if (!session || session.user.banned) return NextResponse.json({ error: "Sign in to download your data." }, { status: 401, headers: noStore });
  const userId = session.user.id;
  if (session.session.impersonatedBy) return NextResponse.json({ error: "Data exports aren't available while impersonating." }, { status: 403, headers: noStore });

  if (!(await consumeRateLimit(`account-export:${userId}`, 3, 60 * 60))) {
    return NextResponse.json({ error: "You can download your data 3 times per hour. Try again later." }, { status: 429, headers: { ...noStore, "Retry-After": "3600" } });
  }

  await db.insert(auditLog).values({
    actorId: userId,
    action: "account.export",
    entity: "user",
    entityId: userId,
    ip: await clientIp(),
    userAgent: request.headers.get("user-agent"),
  });
  (await requestLogger({ scope: "account", userId })).info("account data export started");

  const filename = `allship-data-${new Date().toISOString().slice(0, 10)}.json`;
  return new Response(exportStream(userId), {
    headers: {
      ...noStore,
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "X-Content-Type-Options": "nosniff",
    },
  });
}
