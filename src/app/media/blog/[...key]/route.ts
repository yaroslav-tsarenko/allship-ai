import { readFile } from "node:fs/promises";
import { NextResponse, type NextRequest } from "next/server";
import { BLOG_MEDIA_PREFIX, sniffImageType } from "@/server/storage/blog-media";
import { localPath } from "@/server/storage/local";
import { localStorageAllowed } from "@/server/storage/storage";

export const runtime = "nodejs";

export async function GET(_request: NextRequest, { params }: { params: Promise<{ key: string[] }> }) {
  if (!localStorageAllowed()) return new NextResponse("Not found", { status: 404 });
  const { key } = await params;
  if (!key.every((part) => /^[A-Za-z0-9._-]+$/.test(part) && !part.startsWith("."))) return new NextResponse("Not found", { status: 404 });
  let data: Buffer | null = null;
  try {
    data = await readFile(localPath(`${BLOG_MEDIA_PREFIX}/${key.join("/")}`));
  } catch {
    data = null;
  }
  if (!data) return new NextResponse("Not found", { status: 404 });
  const type = sniffImageType(data.subarray(0, 16));
  if (!type) return new NextResponse("Unsupported media", { status: 415 });
  return new NextResponse(new Uint8Array(data), {
    headers: {
      "Content-Type": type,
      "Content-Length": String(data.byteLength),
      "Cache-Control": "public, max-age=31536000, immutable",
      "X-Content-Type-Options": "nosniff",
      "Content-Security-Policy": "default-src 'none'; sandbox",
    },
  });
}
