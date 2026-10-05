import "server-only";
import { site } from "@/content/site";
import { writingConfigured } from "@/server/ai/writing";
import { getEditorOptions } from "@/server/blog/admin";
import type { EditorOptions } from "./types";

export async function loadEditorOptions(): Promise<EditorOptions> {
  const options = await getEditorOptions();
  return { ...options, siteHost: new URL(site.url).host, aiConfigured: writingConfigured() };
}
