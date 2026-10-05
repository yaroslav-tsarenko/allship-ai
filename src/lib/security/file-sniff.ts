export type SniffedType =
  | "image/jpeg"
  | "image/png"
  | "image/webp"
  | "image/gif"
  | "image/heic"
  | "application/pdf"
  | "image/svg+xml"
  | "text/html";

const ascii = (bytes: Uint8Array, start: number, end: number) =>
  String.fromCharCode(...bytes.subarray(start, end));

const heicBrands = new Set(["heic", "heix", "heim", "heis", "hevc", "hevx", "mif1", "msf1"]);

export const SNIFF_BYTES = 64;

export function sniffFileType(bytes: Uint8Array): SniffedType | null {
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return "image/jpeg";
  if (
    bytes.length >= 8 &&
    bytes[0] === 0x89 &&
    ascii(bytes, 1, 4) === "PNG" &&
    bytes[4] === 0x0d &&
    bytes[5] === 0x0a &&
    bytes[6] === 0x1a &&
    bytes[7] === 0x0a
  )
    return "image/png";
  if (bytes.length >= 12 && ascii(bytes, 0, 4) === "RIFF" && ascii(bytes, 8, 12) === "WEBP")
    return "image/webp";
  if (bytes.length >= 6 && (ascii(bytes, 0, 6) === "GIF87a" || ascii(bytes, 0, 6) === "GIF89a"))
    return "image/gif";
  if (bytes.length >= 12 && ascii(bytes, 4, 8) === "ftyp" && heicBrands.has(ascii(bytes, 8, 12)))
    return "image/heic";
  if (bytes.length >= 5 && ascii(bytes, 0, 5) === "%PDF-") return "application/pdf";
  const head = new TextDecoder("utf-8", { fatal: false })
    .decode(bytes.subarray(0, SNIFF_BYTES))
    .replace(/^﻿/, "")
    .trimStart()
    .toLowerCase();
  if (head.startsWith("<svg") || (head.startsWith("<?xml") && head.includes("<svg"))) return "image/svg+xml";
  if (
    head.startsWith("<!doctype html") ||
    head.startsWith("<html") ||
    head.startsWith("<script") ||
    head.startsWith("<?xml")
  )
    return "text/html";
  return null;
}

export function sniffMatches(bytes: Uint8Array, expected: string) {
  return sniffFileType(bytes) === expected;
}

export const extensionTypes: Record<string, string> = {
  jpg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  heic: "image/heic",
  pdf: "application/pdf",
};

export function typeForKey(key: string) {
  const ext = key.slice(key.lastIndexOf(".") + 1).toLowerCase();
  return extensionTypes[ext] ?? null;
}

const SEGMENT = /^[A-Za-z0-9_-][A-Za-z0-9._-]{0,127}$/;

export function isSafeStorageKey(key: string) {
  if (typeof key !== "string" || key.length === 0 || key.length > 512) return false;
  const parts = key.split("/");
  return parts.every((part) => SEGMENT.test(part) && part !== "." && part !== ".." && !part.includes(".."));
}
