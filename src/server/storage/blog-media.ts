import "server-only";
import { randomUUID } from "node:crypto";
import { env } from "@/env";
import { sniffFileType } from "@/lib/security/file-sniff";
import { localStorageAllowed, signLocal } from "./storage";

export const BLOG_MEDIA_BUCKET = "blog-media";
export const BLOG_MEDIA_PREFIX = "blog";
export const BLOG_MEDIA_ROUTE = "/media/blog";

const extensions: Record<string, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" };

export type BlogUploadTarget = { key: string; url: string; method: "PUT"; headers: Record<string, string>; publicUrl: string };

export async function createBlogUploadTarget(contentType: string): Promise<BlogUploadTarget> {
  const ext = extensions[contentType];
  if (!ext) throw new Error("Unsupported image type");
  const name = `${new Date().toISOString().slice(0, 7)}/${randomUUID()}.${ext}`;
  if (env.NEXT_PUBLIC_SUPABASE_URL && env.SUPABASE_SERVICE_ROLE_KEY) {
    const base = `${env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1`;
    const response = await fetch(`${base}/object/upload/sign/${BLOG_MEDIA_BUCKET}/${name}`, {
      method: "POST",
      headers: { Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`, apikey: env.SUPABASE_SERVICE_ROLE_KEY },
    });
    if (!response.ok) throw new Error(`Storage sign failed: ${response.status}`);
    const data = (await response.json()) as { url: string };
    return {
      key: name,
      url: `${base}${data.url}`,
      method: "PUT",
      headers: { "Content-Type": contentType, "x-upsert": "false", "Cache-Control": "max-age=31536000" },
      publicUrl: `${base}/object/public/${BLOG_MEDIA_BUCKET}/${name}`,
    };
  }
  if (!localStorageAllowed()) throw new Error("File storage is not configured");
  const key = `${BLOG_MEDIA_PREFIX}/${name}`;
  const expiresAt = Date.now() + 10 * 60 * 1000;
  const params = new URLSearchParams({ key, exp: String(expiresAt), sig: signLocal(key, "put", expiresAt) });
  return { key, url: `/api/uploads/local?${params}`, method: "PUT", headers: { "Content-Type": contentType }, publicUrl: `${BLOG_MEDIA_ROUTE}/${name}` };
}

const blogImageTypes = new Set(["image/jpeg", "image/png", "image/webp"]);

export function sniffImageType(bytes: Uint8Array): string | null {
  const type = sniffFileType(bytes);
  return type && blogImageTypes.has(type) ? type : null;
}
