import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BlogEditor } from "@/features/admin/blog/editor";
import { loadEditorOptions } from "@/features/admin/blog/load";
import { requireAdmin } from "@/server/auth/session";
import { getEditorPost } from "@/server/blog/admin";

type Props = { params: Promise<{ id: string }> };

const isUuid = (v: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v);

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  if (!isUuid(id)) return { title: "Post" };
  const post = await getEditorPost(id);
  return { title: post ? `Edit: ${post.title}` : "Post" };
}

export default async function EditPostPage({ params }: Props) {
  await requireAdmin();
  const { id } = await params;
  if (!isUuid(id)) notFound();
  const [post, options] = await Promise.all([getEditorPost(id), loadEditorOptions()]);
  if (!post) notFound();
  const live = post.status === "published" || post.status === "scheduled";
  return (
    <BlogEditor
      key={post.id}
      initial={{
        id: post.id,
        updatedAt: post.updatedAt.toISOString(),
        status: post.status,
        publishedAt: post.publishedAt?.toISOString() ?? null,
        authorName: post.authorName,
        liveSlug: live ? post.slug : null,
        fields: {
          title: post.title,
          slug: post.slug,
          excerpt: post.excerpt,
          body: post.body.markdown,
          coverKey: post.coverKey,
          coverAlt: post.coverAlt,
          categoryId: post.categoryId,
          tagIds: post.tagIds,
          seoTitle: post.seoTitle,
          seoDescription: post.seoDescription,
          canonicalUrl: post.canonicalUrl,
          faq: post.faq,
        },
      }}
      options={options}
    />
  );
}
