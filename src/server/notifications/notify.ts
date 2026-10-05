import "server-only";
import { and, eq, inArray } from "drizzle-orm";
import { db } from "@/server/db/client";
import { member, notification, notificationPreference, user } from "@/server/db/schema";
import { sendEmail } from "@/server/email/send";
import { ActionEmail } from "@/emails/action-email";
import { createElement } from "react";
import { env } from "@/env";
import { publish } from "@/server/realtime/publish";
import { topics } from "@/server/realtime/topics";

type Notice = { type: string; title: string; body: string; href: string; email?: { subject: string; actionLabel: string } };

export async function notifyUsers(userIds: string[], notice: Notice) {
  const ids = [...new Set(userIds)].filter(Boolean);
  if (ids.length === 0) return;
  const created = await db
    .insert(notification)
    .values(ids.map((userId) => ({ userId, type: notice.type, title: notice.title, body: notice.body, href: notice.href })))
    .returning({ id: notification.id, userId: notification.userId });
  await Promise.allSettled(created.map((n) => publish(topics.user(n.userId), { event: "notification", payload: { id: n.id, title: notice.title, href: notice.href } })));
  if (!notice.email) return;
  const [recipients, optOuts] = await Promise.all([
    db.select({ id: user.id, email: user.email }).from(user).where(inArray(user.id, ids)),
    db
      .select({ userId: notificationPreference.userId })
      .from(notificationPreference)
      .where(and(inArray(notificationPreference.userId, ids), eq(notificationPreference.channel, "email"), eq(notificationPreference.type, notice.type), eq(notificationPreference.enabled, false))),
  ]);
  const muted = new Set(optOuts.map((o) => o.userId));
  const url = new URL(notice.href, env.NEXT_PUBLIC_APP_URL).toString();
  await Promise.allSettled(
    recipients
      .filter((r) => !muted.has(r.id))
      .map((r) =>
        sendEmail({
          to: r.email,
          tag: notice.type,
          subject: notice.email!.subject,
          react: createElement(ActionEmail, {
            preview: notice.title,
            heading: notice.title,
            intro: notice.body,
            actionLabel: notice.email!.actionLabel,
            url,
            footnote: "You can change which emails you get in Settings.",
          }),
        }),
      ),
  );
}

export async function orgStaffIds(orgId: string) {
  const rows = await db
    .select({ userId: member.userId })
    .from(member)
    .where(and(eq(member.organizationId, orgId), inArray(member.role, ["owner", "dispatcher"])));
  return rows.map((r) => r.userId);
}
