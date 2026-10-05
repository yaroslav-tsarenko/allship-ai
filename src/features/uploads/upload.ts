import { requestUploadAction } from "@/server/actions/trips";

export type UploadPurpose = "pickup" | "delivery" | "signature" | "dispute" | "chat";
export type UploadContentType = "image/jpeg" | "image/png" | "image/webp" | "image/heic" | "application/pdf";

const MAX_EDGE = 2000;
const RESIZE_ABOVE_BYTES = 1_500_000;
const resizable = new Set(["image/jpeg", "image/png", "image/webp", "image/heic"]);

export class UploadError extends Error {}

function canvasToBlob(canvas: HTMLCanvasElement, type: string, quality: number) {
  return new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, type, quality));
}

export async function prepareImage(file: File): Promise<{ blob: Blob; contentType: UploadContentType }> {
  const original = file.type as UploadContentType;
  if (!resizable.has(file.type)) return { blob: file, contentType: original };
  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
  } catch {
    return { blob: file, contentType: original };
  }
  const longest = Math.max(bitmap.width, bitmap.height);
  if (longest <= MAX_EDGE && file.size <= RESIZE_ABOVE_BYTES && file.type !== "image/heic") {
    bitmap.close();
    return { blob: file, contentType: original };
  }
  const scale = Math.min(1, MAX_EDGE / longest);
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    bitmap.close();
    return { blob: file, contentType: original };
  }
  ctx.fillStyle = "#fff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  const blob = await canvasToBlob(canvas, "image/jpeg", 0.85);
  if (!blob || (blob.size >= file.size && file.type !== "image/heic")) return { blob: file, contentType: original };
  return { blob, contentType: "image/jpeg" };
}

function put(url: string, headers: Record<string, string>, body: Blob, onProgress?: (fraction: number) => void, signal?: AbortSignal) {
  return new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", url);
    for (const [name, value] of Object.entries(headers)) xhr.setRequestHeader(name, value);
    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) onProgress?.(event.loaded / event.total);
    };
    xhr.onload = () => (xhr.status >= 200 && xhr.status < 300 ? resolve() : reject(new UploadError(xhr.status === 413 ? "This file is too large." : "Upload failed. Try again.")));
    xhr.onerror = () => reject(new UploadError("Connection lost. Check your signal and retry."));
    xhr.onabort = () => reject(new UploadError("Upload cancelled."));
    signal?.addEventListener("abort", () => xhr.abort(), { once: true });
    xhr.send(body);
  });
}

export async function uploadBlob({
  loadId,
  purpose,
  blob,
  contentType,
  onProgress,
  signal,
}: {
  loadId: string;
  purpose: UploadPurpose;
  blob: Blob;
  contentType: UploadContentType;
  onProgress?: (fraction: number) => void;
  signal?: AbortSignal;
}) {
  const result = await requestUploadAction({
    loadId,
    purpose,
    contentType,
    size: blob.size,
  });
  if (!result?.data) {
    const fieldError = result?.validationErrors ? "This file type or size isn't supported." : null;
    throw new UploadError(result?.serverError ?? fieldError ?? "Couldn't start the upload. Try again.");
  }
  await put(result.data.url, result.data.headers, blob, onProgress, signal);
  return result.data.key;
}
