"use server";

import { redirect } from "next/navigation";
import { readEmailToken } from "@/server/nurture/links";
import { optOutOfSequence, resubscribe, unsubscribeMarketing } from "@/server/nurture/preferences";
import { isSequenceId } from "@/server/nurture/schedule";

export async function updateEmailPreference(formData: FormData) {
  const raw = String(formData.get("t") ?? "");
  const token = readEmailToken(raw, "unsubscribe");
  if (!token) redirect("/unsubscribe");
  const choice = String(formData.get("choice") ?? "marketing");
  if (choice === "resubscribe") {
    await resubscribe(token.e);
  } else if (choice === "sequence" && isSequenceId(token.s)) {
    await optOutOfSequence(token.e, token.s);
  } else {
    if (isSequenceId(token.s)) await optOutOfSequence(token.e, token.s);
    await unsubscribeMarketing(token.e);
  }
  const done = choice === "resubscribe" ? "resubscribe" : choice === "sequence" && isSequenceId(token.s) ? "sequence" : "marketing";
  redirect(`/unsubscribe?t=${encodeURIComponent(raw)}&done=${done}`);
}
