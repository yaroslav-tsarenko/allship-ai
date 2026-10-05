import "server-only";
import { eq } from "drizzle-orm";
import { env } from "@/env";
import { db } from "@/server/db/client";
import { carrierProfile } from "@/server/db/schema";
import { notifyAdmins } from "@/server/notify/telegram";
import { log } from "@/lib/log";
import { refreshCarrierActivation, safely } from "@/server/nurture";

type QcCarrier = {
  legalName?: string;
  dbaName?: string | null;
  allowedToOperate?: string;
  statusCode?: string;
  dotNumber?: number;
  bipdInsuranceOnFile?: string;
  bipdInsuranceRequired?: string;
  cargoInsuranceOnFile?: string;
};

const normalize = (s: string) => s.toLowerCase().replace(/\b(llc|inc|corp|co|ltd|company|the)\b/g, "").replace(/[^a-z0-9]/g, "");

export function assessFmcsa(record: QcCarrier | null, legalName: string): "verified" | "failed" | "manual_review" {
  if (!record) return "failed";
  if (record.allowedToOperate !== "Y" || record.statusCode !== "A") return "failed";
  const names = [record.legalName, record.dbaName].filter((n): n is string => Boolean(n)).map(normalize);
  const wanted = normalize(legalName);
  const nameMatches = names.some((n) => n === wanted || n.includes(wanted) || wanted.includes(n));
  const insuranceOk = record.bipdInsuranceRequired !== "Y" || Number(record.bipdInsuranceOnFile ?? 0) > 0;
  return nameMatches && insuranceOk ? "verified" : "manual_review";
}

export async function checkCarrierWithFmcsa(orgId: string) {
  const [profile] = await db.select().from(carrierProfile).where(eq(carrierProfile.orgId, orgId)).limit(1);
  if (!profile?.usdotNumber) return;
  if (!env.FMCSA_WEB_KEY) {
    await db.update(carrierProfile).set({ fmcsaStatus: "manual_review", fmcsaCheckedAt: new Date() }).where(eq(carrierProfile.orgId, orgId));
    await notifyAdmins(`Carrier needs manual verification: ${profile.legalName}, USDOT ${profile.usdotNumber}.`);
    return;
  }
  let record: QcCarrier | null = null;
  try {
    const res = await fetch(`https://mobile.fmcsa.dot.gov/qc/services/carriers/${encodeURIComponent(profile.usdotNumber)}?webKey=${env.FMCSA_WEB_KEY}`, { signal: AbortSignal.timeout(8000), cache: "no-store" });
    if (res.ok) record = ((await res.json()) as { content?: { carrier?: QcCarrier } }).content?.carrier ?? null;
  } catch (error) {
    log.error("fmcsa lookup failed", { scope: "fmcsa", orgId, err: error });
    await db.update(carrierProfile).set({ fmcsaStatus: "manual_review", fmcsaCheckedAt: new Date() }).where(eq(carrierProfile.orgId, orgId));
    return;
  }
  const status = assessFmcsa(record, profile.legalName);
  await db
    .update(carrierProfile)
    .set({ fmcsaStatus: status, fmcsaCheckedAt: new Date(), fmcsaSnapshot: record ? JSON.stringify(record) : null })
    .where(eq(carrierProfile.orgId, orgId));
  if (status === "verified") await safely("carrier fmcsa verified", () => refreshCarrierActivation(orgId));
  if (status !== "verified") await notifyAdmins(`FMCSA check needs review (${status}): ${profile.legalName}, USDOT ${profile.usdotNumber}.`);
}
