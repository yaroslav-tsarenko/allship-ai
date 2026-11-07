import { asteriskCensorStrategy, englishDataset, englishRecommendedTransformers, keepStartCensorStrategy, RegExpMatcher, TextCensor } from "obscenity";
import { z } from "zod";

export type ContactKind = "phone" | "email" | "link" | "handle" | "request";

export type TextIssue = { kind: "profanity" | "spam" | ContactKind; message: string };

export type TextRules = { profanity?: boolean; contacts?: boolean; spam?: boolean };

const AFTER_BOOKING = "Contact details are shared after you book, which keeps the payment protected in escrow.";

export const textMessages: Record<TextIssue["kind"], string> = {
  profanity: "Please remove the offensive language.",
  spam: "This doesn't look like a real description. Use words carriers can act on.",
  phone: `Remove the phone number. ${AFTER_BOOKING}`,
  email: `Remove the email address. ${AFTER_BOOKING}`,
  link: `Remove the link or website. ${AFTER_BOOKING}`,
  handle: `Remove the social or messaging handle. ${AFTER_BOOKING}`,
  request: `Leave out requests to call, text or message you. ${AFTER_BOOKING}`,
};

let matcher: RegExpMatcher | null = null;

function profanityMatcher() {
  matcher ??= new RegExpMatcher({ ...englishDataset.build(), ...englishRecommendedTransformers });
  return matcher;
}

const spacedLetters = /\b(?:[a-z][\s.*_-]{1,2}){2,}[a-z]\b/gi;

function joinSpacedLetters(text: string) {
  return text.replace(spacedLetters, (m) => m.replace(/[\s.*_-]/g, ""));
}

const safeWords = /\b(?:shiitake|cockpit|cockatoo|cocker\s+spaniel|dickens|hancock|peacock|scunthorpe)\b/gi;

export function hasProfanity(text: string) {
  if (!text) return false;
  const m = profanityMatcher();
  const t = text.replace(safeWords, " ");
  return m.hasMatch(t) || m.hasMatch(joinSpacedLetters(t));
}

const censor = new TextCensor().setStrategy(keepStartCensorStrategy(asteriskCensorStrategy()));

export function maskProfanity(text: string) {
  if (!text) return text;
  const m = profanityMatcher();
  const matches = m.getAllMatches(text, true);
  return matches.length ? censor.applyTo(text, matches) : text;
}

const digitWords: Record<string, string> = { zero: "0", oh: "0", one: "1", two: "2", three: "3", four: "4", five: "5", six: "6", seven: "7", eight: "8", nine: "9" };
const digitToken = `(?:\\d|${Object.keys(digitWords).join("|")})`;
const phoneRun = new RegExp(`(?<![\\w.])\\+?${digitToken}(?:[\\s().\\-/_+]{0,3}${digitToken}){6,}(?![\\w])`, "gi");
const sevenDigit = /(?<![\d-])\d{3}[\s.-]\d{4}(?![\d-])/;

function countDigits(run: string) {
  const words = run.toLowerCase().match(new RegExp(digitToken, "g")) ?? [];
  return words.map((w) => digitWords[w] ?? w).join("");
}

function looksLikePhone(raw: string) {
  const groups = raw.split(/\D+/).filter(Boolean).map((g) => g.length);
  const total = groups.reduce((a, b) => a + b, 0);
  if (groups.some((g) => g === 5)) return false;
  if (groups.length > 1 && groups.every((g) => g === 2)) return false;
  if (raw.trimStart().startsWith("+")) return total >= 10 && total <= 13;
  return total === 10 || (total === 11 && raw.trimStart().startsWith("1"));
}

function hasPhone(text: string) {
  for (const m of text.matchAll(phoneRun)) {
    if (/[a-z]/i.test(m[0])) {
      if (countDigits(m[0]).length >= 7) return true;
    } else if (looksLikePhone(m[0])) return true;
  }
  return sevenDigit.test(text) && /\b(call|text|phone|cell|mobile|number|tel|reach|contact)\b/i.test(text);
}

const tlds = "com|net|org|io|co|us|biz|info|me|app|ly|link|site|online|xyz|ru|ua|ca|uk|de|ai|gg|tv|to|cc|page|store|shop|live";
const emailPlain = /[\w.+-]+@[\w-]+(?:\.[\w-]+)+/i;
const providers = "gmail|googlemail|yahoo|hotmail|outlook|icloud|aol|proton|protonmail|msn|ymail|gmx|zoho";
const atWord = String.raw`(?:\s*@\s*|\s*[([{<]\s*at\s*[)\]}>]\s*|\s+at\s+)`;
const dotWord = String.raw`(?:\.|\s*[([{<]\s*dot\s*[)\]}>]\s*|\s+dot\s+)`;
const emailObfuscated = new RegExp(String.raw`\b[a-z0-9][\w.+-]*${atWord}[a-z0-9-]+${dotWord}(?:${tlds})\b`, "i");
const emailProvider = new RegExp(String.raw`\b[a-z0-9][\w.+-]*${atWord}(?:${providers})\b`, "i");

function hasEmail(text: string) {
  return emailPlain.test(text) || emailObfuscated.test(text) || emailProvider.test(text);
}

const urlScheme = /\b(?:https?:\/\/|www\.)\S+/i;
const bareDomain = new RegExp(String.raw`\b[a-z0-9][a-z0-9-]{1,62}\.(?:${tlds})(?:\/\S*)?\b`, "i");
const spelledDomain = new RegExp(String.raw`\b[a-z0-9-]{2,}\s*(?:[([{<]\s*dot\s*[)\]}>]|\s+dot\s+)\s*(?:${tlds})\b`, "i");
const shortLinks = /\b(?:wa\.me|t\.me|bit\.ly|linktr\.ee)\b/i;

function hasLink(text: string) {
  return urlScheme.test(text) || shortLinks.test(text) || bareDomain.test(text) || spelledDomain.test(text);
}

const apps = "whats\\s?app|telegram|signal|viber|wechat|kik|discord|skype|snapchat|insta(?:gram)?|ig|facebook|fb|messenger|tiktok|twitter|line\\s?id|imessage";
const verbApps = "whats\\s?app|telegram|viber|wechat|skype|discord|facetime|imessage|snapchat|insta(?:gram)?|facebook|messenger";
const handle = /(?:^|[\s(:,;])@[a-z_][a-z0-9_.]{1,29}\b/i;
const appHandle = new RegExp(String.raw`\b(?:${apps})\b\s*(?::|-|\bid\b|\bhandle\b|\buser(?:name)?\b|@)\s*@?[a-z0-9_.]{2,}`, "i");
const appVerb = new RegExp(String.raw`\b(?:${verbApps})\s+me\b|\b(?:message|msg|text|dm|ping|add|find|contact|reach|hit)\s+(?:me\s+)?(?:up\s+)?(?:on|via|at|through)\s+(?:${apps})\b`, "i");

function hasHandle(text: string) {
  return handle.test(text) || appHandle.test(text) || appVerb.test(text);
}

const requestPatterns = [
  /\b(?:call|text|phone|ring|dm|email|e-mail|message|msg|contact|reach)\s+me\b/i,
  /\bmy\s+(?:cell|mobile|phone)\s*(?:number|#|is\b|:)/i,
  /\bmy\s+(?:number|email|e-mail|whats\s?app|telegram|contact\s+info|insta(?:gram)?|handle)\b/i,
  /\bhit\s+me\s+up\b/i,
  /\b(?:give|send)\s+(?:me\s+)?(?:a\s+)?(?:call|text|ring)\b/i,
];

function hasRequest(text: string) {
  return requestPatterns.some((p) => p.test(text));
}

export function findContact(text: string): ContactKind | null {
  if (!text) return null;
  if (hasEmail(text)) return "email";
  if (hasLink(text)) return "link";
  if (hasHandle(text)) return "handle";
  if (hasPhone(text)) return "phone";
  if (hasRequest(text)) return "request";
  return null;
}

export function isSpam(text: string) {
  const t = text.trim();
  if (!t) return false;
  if (!/[\p{L}\p{N}]/u.test(t)) return true;
  if (/(\S)\1{7,}/u.test(t)) return true;
  const chars = t.replace(/\s/g, "");
  if (chars.length >= 10 && new Set(chars.toLowerCase()).size <= 2) return true;
  return /^(.{1,4}?)\1{5,}$/u.test(chars);
}

export function normalizeText(text: string, multiline = false) {
  const t = text.replace(/\r\n?/g, "\n").replace(/[​-‍﻿]/g, "");
  if (!multiline) return t.replace(/\s+/g, " ").trim();
  return t
    .split("\n")
    .map((line) => line.replace(/[^\S\n]+/g, " ").trim())
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export function checkText(text: string, rules: TextRules = {}): TextIssue | null {
  const { profanity = true, contacts = true, spam = true } = rules;
  if (!text.trim()) return null;
  if (spam && isSpam(text)) return { kind: "spam", message: textMessages.spam };
  if (profanity && hasProfanity(text)) return { kind: "profanity", message: textMessages.profanity };
  if (contacts) {
    const kind = findContact(text);
    if (kind) return { kind, message: textMessages[kind] };
  }
  return null;
}

type PolicyTextOptions = TextRules & { label: string; min?: number; max: number; multiline?: boolean; required?: boolean; minMessage?: string };

export function policyText({ label, min, max, multiline = false, required = false, minMessage, ...rules }: PolicyTextOptions) {
  const lower = label.toLowerCase();
  return z
    .string({ error: `Enter ${lower}` })
    .overwrite((v) => normalizeText(v, multiline))
    .superRefine((v, ctx) => {
      if (!v) {
        if (required) ctx.addIssue({ code: "custom", message: `Enter ${lower}` });
        return;
      }
      if (min && v.length < min) {
        ctx.addIssue({ code: "custom", message: minMessage ?? `Use at least ${min} characters` });
        return;
      }
      if (v.length > max) {
        ctx.addIssue({ code: "custom", message: `Keep it under ${max.toLocaleString("en-US")} characters` });
        return;
      }
      const issue = checkText(v, rules);
      if (issue) ctx.addIssue({ code: "custom", message: issue.message });
    });
}
