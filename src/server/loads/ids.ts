import "server-only";
import { randomInt } from "node:crypto";

const alphabet = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";

export function newPublicLoadId() {
  let out = "";
  for (let i = 0; i < 6; i++) out += alphabet[randomInt(alphabet.length)];
  return `AS-${out}`;
}
