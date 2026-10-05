import "server-only";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import { auth } from "./auth";

export const getSession = cache(async () => auth.api.getSession({ headers: await headers() }));

export async function requireSession() {
  const session = await getSession();
  if (!session) redirect("/sign-in");
  return session;
}

export async function requireAdmin() {
  const session = await requireSession();
  const fresh = await auth.api.getSession({ headers: await headers(), query: { disableCookieCache: true } });
  const current = fresh?.user ?? session.user;
  if (current.role !== "admin") redirect("/app");
  if (!current.twoFactorEnabled) redirect("/app/settings/security?require=2fa");
  return session;
}
