import { createBlogUploadAction } from "@/server/actions/blog";
import { IMAGE_TYPES, MAX_IMAGE_BYTES, MAX_IMAGE_EDGE } from "./rules";

type ImageType = (typeof IMAGE_TYPES)[number];

async function downscale(file: File): Promise<Blob> {
  if (typeof createImageBitmap !== "function") return file;
  const bitmap = await createImageBitmap(file).catch(() => null);
  if (!bitmap) return file;
  const scale = Math.min(1, MAX_IMAGE_EDGE / Math.max(bitmap.width, bitmap.height));
  if (scale === 1 && file.size <= 1.5 * 1024 * 1024) {
    bitmap.close();
    return file;
  }
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  const ctx = canvas.getContext("2d");
  if (!ctx) return file;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  const type = file.type === "image/png" ? "image/png" : "image/webp";
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, type, 0.86));
  if (!blob) return file;
  if (type === "image/png" && blob.size > 2 * 1024 * 1024) {
    const webp = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/webp", 0.86));
    return webp && webp.type === "image/webp" ? webp : blob;
  }
  return blob;
}

export async function uploadBlogImage(file: File): Promise<string> {
  if (!(IMAGE_TYPES as readonly string[]).includes(file.type)) throw new Error("Use a JPG, PNG or WebP image.");
  if (file.size > 40 * 1024 * 1024) throw new Error("This image is too large. Use one under 8 MB.");
  const blob = await downscale(file);
  const type = (IMAGE_TYPES as readonly string[]).includes(blob.type) ? (blob.type as ImageType) : (file.type as ImageType);
  if (blob.size > MAX_IMAGE_BYTES) throw new Error("This image is still over 8 MB after resizing. Use a smaller file.");
  const target = await createBlogUploadAction({ contentType: type, size: blob.size });
  if (!target?.data) throw new Error(target?.serverError ?? target?.validationErrors?.size?._errors?.[0] ?? "Couldn't start the upload.");
  const response = await fetch(target.data.url, { method: target.data.method, headers: target.data.headers, body: blob });
  if (!response.ok) throw new Error("The upload failed. Check your connection and try again.");
  return target.data.publicUrl;
}
