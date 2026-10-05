export class BodyTooLargeError extends Error {
  constructor(readonly limit: number) {
    super(`Body exceeds ${limit} bytes`);
  }
}

export async function readLimited(
  stream: ReadableStream<Uint8Array> | null,
  limit: number,
): Promise<Uint8Array> {
  if (!stream) return new Uint8Array(0);
  const reader = stream.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      total += value.byteLength;
      if (total > limit) {
        await reader.cancel().catch(() => undefined);
        throw new BodyTooLargeError(limit);
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }
  const out = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    out.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return out;
}

export function declaredLengthExceeds(headers: Headers, limit: number) {
  const declared = Number(headers.get("content-length") ?? "0");
  return Number.isFinite(declared) && declared > limit;
}
