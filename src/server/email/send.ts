import "server-only";
import { eq } from "drizzle-orm";
import { render } from "react-email";
import type { ReactElement } from "react";
import { Resend } from "resend";
import { env } from "@/env";
import { db } from "@/server/db/client";
import { emailSuppression } from "@/server/db/schema";

const resend = env.RESEND_API_KEY ? new Resend(env.RESEND_API_KEY) : null;

export type EmailCategory = "transactional" | "lifecycle" | "marketing";
export type SendResult = { status: "sent" | "logged" | "suppressed"; id?: string };

type SendInput = { to: string; subject: string; react: ReactElement; tag: string; category?: EmailCategory; unsubscribeUrl?: string; replyTo?: string };

const tagValue = (value: string) => value.replace(/[^A-Za-z0-9_-]/g, "_").slice(0, 256);

export async function suppressionFor(email: string) {
  const [row] = await db.select({ reason: emailSuppression.reason, scope: emailSuppression.scope }).from(emailSuppression).where(eq(emailSuppression.email, email.trim().toLowerCase())).limit(1);
  return row ?? null;
}

export function blocksCategory(row: { reason: string; scope: string } | null, category: EmailCategory) {
  if (!row) return false;
  if (category === "transactional") return row.scope === "all" && row.reason === "bounced";
  return true;
}

export async function sendEmail({ to, subject, react, tag, category = "transactional", unsubscribeUrl, replyTo }: SendInput): Promise<SendResult> {
  if (blocksCategory(await suppressionFor(to), category)) {
    console.info(`[email:${tag}] suppressed to=${to} category=${category}`);
    return { status: "suppressed" };
  }

  const [html, text] = await Promise.all([render(react), render(react, { plainText: true })]);
  const headers: Record<string, string> = unsubscribeUrl ? { "List-Unsubscribe": `<${unsubscribeUrl}>`, "List-Unsubscribe-Post": "List-Unsubscribe=One-Click" } : {};

  if (!resend) {
    if (env.NODE_ENV === "production") throw new Error("RESEND_API_KEY is not configured");
    const headerLines = Object.entries(headers).map(([k, v]) => `${k}: ${v}`).join("\n");
    console.info(`[email:${tag}] to=${to} category=${category} subject="${subject}"${headerLines ? `\n${headerLines}` : ""}\n${text}`);
    return { status: "logged" };
  }

  const { data, error } = await resend.emails.send({
    from: env.EMAIL_FROM,
    to,
    subject,
    html,
    text,
    replyTo,
    headers: Object.keys(headers).length > 0 ? headers : undefined,
    tags: [
      { name: "category", value: tagValue(tag) },
      { name: "stream", value: category },
    ],
  });
  if (error) throw new Error(`Email send failed: ${error.message}`);
  return { status: "sent", id: data?.id };
}
