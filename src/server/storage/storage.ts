import "server-only";
import { createHmac, randomUUID, timingSafeEqual } from "node:crypto";
import { env } from "@/env";
import { isSafeStorageKey, SNIFF_BYTES, sniffFileType, typeForKey } from "@/lib/security/file-sniff";

export const MEDIA_BUCKET = "load-media";
export const MAX_UPLOAD_BYTES = 15 * 1024 * 1024;
export const ALLOWED_UPLOAD_TYPES = ["image/jpeg", "image/png", "image/webp", "image/heic", "application/pdf"] as const;

export type UploadTarget = { key: string; url: string; method: "PUT"; headers: Record<string, string> };

function supabaseStorage() {
  if (!env.NEXT_PUBLIC_SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) return null;
  return { base: `${env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1`, key: env.SUPABASE_SERVICE_ROLE_KEY };
}

export function localStorageAllowed() {
  return env.NODE_ENV !== "production" && !supabaseStorage();
}

function extensionFor(contentType: string) {
  return { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp", "image/heic": "heic", "application/pdf": "pdf" }[contentType] ?? "bin";
}

export function buildKey(prefix: string, contentType: string) {
  return `${prefix}/${randomUUID()}.${extensionFor(contentType)}`;
}

export function signLocal(key: string, purpose: "put" | "get", expiresAt: number) {
  return createHmac("sha256", env.BETTER_AUTH_SECRET).update(`${purpose}:${key}:${expiresAt}`).digest("base64url");
}

export function verifyLocal(key: string, purpose: "put" | "get", expiresAt: number, signature: string) {
  if (Date.now() > expiresAt) return false;
  const expected = Buffer.from(signLocal(key, purpose, expiresAt));
  const given = Buffer.from(signature);
  return expected.length === given.length && timingSafeEqual(expected, given);
}

export async function createUploadTarget(prefix: string, contentType: string): Promise<UploadTarget> {
  if (!(ALLOWED_UPLOAD_TYPES as readonly string[]).includes(contentType)) throw new Error("Unsupported type");
  const key = buildKey(prefix, contentType);
  if (!isSafeStorageKey(key)) throw new Error("Invalid key");
  const remote = supabaseStorage();
  if (remote) {
    const response = await fetch(`${remote.base}/object/upload/sign/${MEDIA_BUCKET}/${key}`, {
      method: "POST",
      headers: { Authorization: `Bearer ${remote.key}`, apikey: remote.key },
    });
    if (!response.ok) throw new Error(`Storage sign failed: ${response.status}`);
    const data = (await response.json()) as { url: string };
    return { key, url: `${remote.base}${data.url}`, method: "PUT", headers: { "Content-Type": contentType, "x-upsert": "false" } };
  }
  if (!localStorageAllowed()) throw new Error("File storage is not configured");
  const expiresAt = Date.now() + 10 * 60 * 1000;
  const params = new URLSearchParams({ key, exp: String(expiresAt), sig: signLocal(key, "put", expiresAt) });
  return { key, url: `/api/uploads/local?${params}`, method: "PUT", headers: { "Content-Type": contentType } };
}

export async function signedReadUrl(key: string, expiresInSeconds = 60 * 30) {
  if (!isSafeStorageKey(key)) return null;
  const remote = supabaseStorage();
  if (remote) {
    const response = await fetch(`${remote.base}/object/sign/${MEDIA_BUCKET}/${key}`, {
      method: "POST",
      headers: { Authorization: `Bearer ${remote.key}`, apikey: remote.key, "Content-Type": "application/json" },
      body: JSON.stringify({ expiresIn: expiresInSeconds }),
      next: { revalidate: 0 },
    });
    if (!response.ok) return null;
    const data = (await response.json()) as { signedURL: string };
    return `${remote.base}${data.signedURL}`;
  }
  if (!localStorageAllowed()) return null;
  const expiresAt = Date.now() + expiresInSeconds * 1000;
  const params = new URLSearchParams({ key, exp: String(expiresAt), sig: signLocal(key, "get", expiresAt) });
  return `/api/uploads/local?${params}`;
}

function verifiedHead(key: string, head: Uint8Array, size: number) {
  const expected = typeForKey(key);
  return Boolean(expected) && size > 0 && size <= MAX_UPLOAD_BYTES && sniffFileType(head) === expected;
}

export async function objectExists(key: string) {
  if (!isSafeStorageKey(key) || !typeForKey(key)) return false;
  const remote = supabaseStorage();
  if (remote) {
    const response = await fetch(`${remote.base}/object/authenticated/${MEDIA_BUCKET}/${key}`, {
      headers: { Authorization: `Bearer ${remote.key}`, apikey: remote.key, Range: `bytes=0-${SNIFF_BYTES - 1}` },
      cache: "no-store",
      signal: AbortSignal.timeout(8000),
    }).catch(() => null);
    if (!response || (response.status !== 200 && response.status !== 206)) return false;
    const total = Number(response.headers.get("content-range")?.split("/")[1] ?? response.headers.get("content-length") ?? 0);
    const reader = response.body?.getReader();
    const chunks: Uint8Array[] = [];
    let read = 0;
    while (reader && read < SNIFF_BYTES) {
      const { done, value } = await reader.read();
      if (done) break;
      chunks.push(value);
      read += value.byteLength;
    }
    await reader?.cancel().catch(() => undefined);
    const head = new Uint8Array(Buffer.concat(chunks).subarray(0, SNIFF_BYTES));
    return verifiedHead(key, head, total || read);
  }
  if (!localStorageAllowed()) return false;
  const { open } = await import("node:fs/promises");
  const { localPath } = await import("./local");
  const handle = await open(localPath(key), "r").catch(() => null);
  if (!handle) return false;
  try {
    const { size } = await handle.stat();
    const head = new Uint8Array(SNIFF_BYTES);
    const { bytesRead } = await handle.read(head, 0, SNIFF_BYTES, 0);
    return verifiedHead(key, head.subarray(0, bytesRead), size);
  } finally {
    await handle.close();
  }
}
