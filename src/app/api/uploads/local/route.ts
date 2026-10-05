import { mkdir, readFile, rename, stat, writeFile } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import path from "node:path";
import { NextResponse, type NextRequest } from "next/server";
import { isSafeStorageKey, sniffFileType, typeForKey } from "@/lib/security/file-sniff";
import { BodyTooLargeError, declaredLengthExceeds, readLimited } from "@/lib/security/read-limited";
import { BLOG_MEDIA_PREFIX } from "@/server/storage/blog-media";
import { localPath } from "@/server/storage/local";
import { MAX_UPLOAD_BYTES, localStorageAllowed, verifyLocal } from "@/server/storage/storage";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const BLOG_MAX_BYTES = 8 * 1024 * 1024;
const inlineTypes = new Set(["image/jpeg", "image/png", "image/webp"]);

function parse(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  return { key: params.get("key") ?? "", exp: Number(params.get("exp") ?? 0), sig: params.get("sig") ?? "" };
}

const fail = (error: string, status: number) => NextResponse.json({ error }, { status });

export async function PUT(request: NextRequest) {
  if (!localStorageAllowed()) return fail("Not found", 404);
  const { key, exp, sig } = parse(request);
  if (!isSafeStorageKey(key) || !verifyLocal(key, "put", exp, sig)) return fail("Forbidden", 403);
  const expected = typeForKey(key);
  const declared = (request.headers.get("content-type") ?? "").split(";")[0]!.trim().toLowerCase();
  if (!expected || declared !== expected) return fail("Unsupported type", 415);
  const limit = key.startsWith(`${BLOG_MEDIA_PREFIX}/`) ? BLOG_MAX_BYTES : MAX_UPLOAD_BYTES;
  if (declaredLengthExceeds(request.headers, limit)) return fail("Too large", 413);
  let body: Uint8Array;
  try {
    body = await readLimited(request.body, limit);
  } catch (error) {
    if (error instanceof BodyTooLargeError) return fail("Too large", 413);
    return fail("Upload failed", 400);
  }
  if (body.byteLength === 0) return fail("Empty upload", 400);
  if (sniffFileType(body.subarray(0, 64)) !== expected)
    return fail("File content does not match its type", 415);
  const target = localPath(key);
  if (
    await stat(target).then(
      () => true,
      () => false,
    )
  )
    return fail("Already uploaded", 409);
  await mkdir(path.dirname(target), { recursive: true });
  const temp = `${target}.${randomUUID()}.part`;
  await writeFile(temp, body, { flag: "wx" });
  await rename(temp, target);
  return NextResponse.json({ key });
}

export async function GET(request: NextRequest) {
  if (!localStorageAllowed()) return fail("Not found", 404);
  const { key, exp, sig } = parse(request);
  if (!isSafeStorageKey(key) || !verifyLocal(key, "get", exp, sig)) return fail("Forbidden", 403);
  const data = await readFile(localPath(key)).catch(() => null);
  if (!data) return fail("Not found", 404);
  const sniffed = sniffFileType(data.subarray(0, 64));
  const expected = typeForKey(key);
  if (!sniffed || sniffed !== expected) return fail("Unsupported media", 415);
  const filename = path.basename(key);
  return new NextResponse(new Uint8Array(data), {
    headers: {
      "Content-Type": sniffed,
      "Content-Length": String(data.byteLength),
      "Content-Disposition": `${inlineTypes.has(sniffed) ? "inline" : "attachment"}; filename="${filename}"`,
      "Cache-Control": "private, max-age=600",
      "X-Content-Type-Options": "nosniff",
      "Content-Security-Policy": "default-src 'none'; img-src 'self'; style-src 'unsafe-inline'; sandbox",
      "Cross-Origin-Resource-Policy": "same-origin",
    },
  });
}
