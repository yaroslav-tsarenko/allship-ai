import { createHmac } from "node:crypto";
import { config } from "dotenv";

config({ path: ".env.local" });
config();

const secret = process.env.BETTER_AUTH_SECRET;
if (!secret) throw new Error("BETTER_AUTH_SECRET is required");
const hours = Number(process.argv[2] ?? 72);
const origin = process.argv[3] ?? "https://allship.ai";
const expires = Date.now() + hours * 3_600_000;
const mac = createHmac("sha256", secret).update(`square-connect:${expires}`).digest("base64url");
console.log(`${origin}/api/square/connect?t=${expires}.${mac}`);
console.log(`Expires ${new Date(expires).toISOString()}`);
