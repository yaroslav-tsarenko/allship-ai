import "server-only";
import path from "node:path";

const root = path.join(process.cwd(), ".uploads");

export function localPath(key: string) {
  const resolved = path.resolve(root, key);
  if (!resolved.startsWith(root + path.sep)) throw new Error("Invalid key");
  return resolved;
}
