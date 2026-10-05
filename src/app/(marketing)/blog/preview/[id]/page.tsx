import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Container } from "@/components/marketing/section";
import { effectiveStatus } from "@/features/admin/blog/rules";
import { requireAdmin } from "@/server/auth/session";
import { getPreviewPost } from "@/server/blog/admin";
import { getRelatedPosts } from "@/server/blog/queries";
import { PostArticle } from "../../post-article";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Preview", robots: { index: false, follow: false, nocache: true } };

type Props = { params: Promise<{ id: string }> };

const statusLabel: Record<string, string> = { draft: "Draft", scheduled: "Scheduled", published: "Published", archived: "Archived" };

export default async function BlogPreviewPage({ params }: Props) {
  await requireAdmin();
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const post = await getPreviewPost(id);
  if (!post) notFound();
  const related = await getRelatedPosts(post.id, post.categoryId, 3);
  const banner = (
    <div className="border-b border-outline-variant bg-surface-container">
      <Container className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 py-3">
        <p className="text-body-md text-on-surface-variant">
          <span className="font-medium text-on-surface">Preview</span> · {statusLabel[effectiveStatus(post.status, post.publishedAt)]} · only admins can see this page
        </p>
        <Link href={`/admin/blog/${post.id}`} className="text-label-lg font-medium text-primary underline-offset-4 hover:underline">
          Back to editor
        </Link>
      </Container>
    </div>
  );
  return <PostArticle post={post} related={related} banner={banner} />;
}
