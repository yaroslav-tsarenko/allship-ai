import { describe, expect, it } from "vitest";
import { isSafeStorageKey, sniffFileType, typeForKey } from "@/lib/security/file-sniff";
import { BodyTooLargeError, readLimited } from "@/lib/security/read-limited";

const bytes = (...values: Array<number | string>) =>
  new Uint8Array(values.flatMap((v) => (typeof v === "string" ? [...v].map((c) => c.charCodeAt(0)) : [v])));

describe("sniffFileType", () => {
  it("detects allowed binary formats by magic bytes", () => {
    expect(sniffFileType(bytes(0xff, 0xd8, 0xff, 0xe0))).toBe("image/jpeg");
    expect(sniffFileType(bytes(0x89, "PNG", 0x0d, 0x0a, 0x1a, 0x0a))).toBe("image/png");
    expect(sniffFileType(bytes("RIFF", 0, 0, 0, 0, "WEBPVP8 "))).toBe("image/webp");
    expect(sniffFileType(bytes(0, 0, 0, 0x18, "ftypheic"))).toBe("image/heic");
    expect(sniffFileType(bytes("%PDF-1.7"))).toBe("application/pdf");
  });

  it("flags SVG and HTML regardless of the declared type", () => {
    expect(
      sniffFileType(bytes('<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>')),
    ).toBe("image/svg+xml");
    expect(sniffFileType(bytes(0xef, 0xbb, 0xbf, '  <?xml version="1.0"?><svg>'))).toBe("image/svg+xml");
    expect(sniffFileType(bytes("<!DOCTYPE html><html>"))).toBe("text/html");
    expect(sniffFileType(bytes("<script>alert(1)</script>"))).toBe("text/html");
  });

  it("returns null for unknown content", () => {
    expect(sniffFileType(bytes("hello world"))).toBeNull();
    expect(sniffFileType(new Uint8Array())).toBeNull();
  });
});

describe("storage keys", () => {
  it.each(["loads/0b6f7e3c-1d1b-4c55-9f3a-2f1e4b3c9d10/chat/9d7a.jpg", "blog/2026-10/abc.webp"])(
    "accepts %s",
    (key) => {
      expect(isSafeStorageKey(key)).toBe(true);
    },
  );

  it.each([
    "../etc/passwd",
    "loads/x/../../other/file.jpg",
    "loads//x.jpg",
    "/abs.jpg",
    "loads/.hidden",
    "loads/x\\y.jpg",
    "loads/x y.jpg",
    "loads/%2e%2e/x.jpg",
    "",
  ])("rejects %s", (key) => {
    expect(isSafeStorageKey(key)).toBe(false);
  });

  it("maps extensions to the only types they may hold", () => {
    expect(typeForKey("a/b.pdf")).toBe("application/pdf");
    expect(typeForKey("a/b.svg")).toBeNull();
    expect(typeForKey("a/b.html")).toBeNull();
  });
});

function streamOf(chunks: number[]) {
  return new ReadableStream<Uint8Array>({
    start(controller) {
      for (const size of chunks) controller.enqueue(new Uint8Array(size));
      controller.close();
    },
  });
}

describe("readLimited", () => {
  it("reads a body within the limit", async () => {
    expect((await readLimited(streamOf([10, 20]), 30)).byteLength).toBe(30);
  });

  it("aborts as soon as the limit is crossed", async () => {
    await expect(readLimited(streamOf([20, 20, 20]), 30)).rejects.toBeInstanceOf(BodyTooLargeError);
  });

  it("handles a missing body", async () => {
    expect((await readLimited(null, 10)).byteLength).toBe(0);
  });
});
