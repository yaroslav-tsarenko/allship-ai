import type { Metadata } from "next";
import { BlogEditor } from "@/features/admin/blog/editor";
import { loadEditorOptions } from "@/features/admin/blog/load";
import { emptyFields } from "@/features/admin/blog/types";
import { requireAdmin } from "@/server/auth/session";

export const metadata: Metadata = { title: "New post" };

export default async function NewPostPage() {
  const session = await requireAdmin();
  const options = await loadEditorOptions();
  return <BlogEditor initial={{ id: null, updatedAt: null, status: "draft", publishedAt: null, authorName: session.user.name, liveSlug: null, fields: emptyFields }} options={options} />;
}
