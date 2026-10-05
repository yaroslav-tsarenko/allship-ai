import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { getActor } from "@/server/actor";
import { runAssistant, MAX_INPUT_CHARS } from "@/server/ai/run";
import { getSession } from "@/server/auth/session";
import { consumeRateLimit } from "@/server/rate-limit";
import { log } from "@/lib/log";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const body = z.object({
  threadId: z.uuid().nullable().default(null),
  text: z.string().trim().min(1).max(MAX_INPUT_CHARS),
  page: z.object({ path: z.string().max(200).regex(/^\/[\w\-/]*$/), title: z.string().max(120).optional(), publicId: z.string().regex(/^AS-[A-Z0-9]{4,10}$/).optional() }).nullable().default(null),
});

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Sign in to use the assistant." }, { status: 401 });
  const origin = request.headers.get("origin");
  if (origin && new URL(origin).host !== request.nextUrl.host) return NextResponse.json({ error: "Bad origin" }, { status: 403 });
  const parsed = body.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Write a message first." }, { status: 400 });
  const userId = session.user.id;
  const [burst, daily] = await Promise.all([consumeRateLimit(`ai:${userId}`, 20, 300), consumeRateLimit(`ai-day:${userId}`, 200, 86_400)]);
  if (!burst || !daily) return NextResponse.json({ error: daily ? "You're sending messages quickly. Wait a minute and try again." : "You've reached today's assistant limit. It resets tomorrow." }, { status: 429 });

  const actor = await getActor(userId).catch(() => null);
  if (!actor) return NextResponse.json({ error: "Your account is not available." }, { status: 403 });
  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        for await (const event of runAssistant({ actor, threadId: parsed.data.threadId, text: parsed.data.text, page: parsed.data.page })) {
          controller.enqueue(encoder.encode(`${JSON.stringify(event)}\n`));
        }
      } catch (error) {
        log.error("assistant stream failed", { scope: "ai", err: error });
        controller.enqueue(encoder.encode(`${JSON.stringify({ type: "error", message: "The assistant ran into a problem. Try again in a moment." })}\n`));
      } finally {
        controller.close();
      }
    },
  });
  return new Response(stream, { headers: { "Content-Type": "application/x-ndjson; charset=utf-8", "Cache-Control": "no-store", "X-Accel-Buffering": "no" } });
}
