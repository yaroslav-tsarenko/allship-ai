import { eq } from "drizzle-orm";
import { NextResponse, type NextRequest } from "next/server";
import { db } from "@/server/db/client";
import { newsletterSubscriber } from "@/server/db/schema";
import { verifyNewsletterToken } from "@/server/marketing/newsletter-token";

export async function GET(request: NextRequest) {
  const email = request.nextUrl.searchParams.get("email")?.toLowerCase() ?? "";
  const token = request.nextUrl.searchParams.get("token") ?? "";
  if (!email || !token || !verifyNewsletterToken(email, token)) {
    return NextResponse.redirect(new URL("/?newsletter=invalid", request.url));
  }
  await db.update(newsletterSubscriber).set({ confirmedAt: new Date() }).where(eq(newsletterSubscriber.email, email));
  return NextResponse.redirect(new URL("/?newsletter=confirmed", request.url));
}
