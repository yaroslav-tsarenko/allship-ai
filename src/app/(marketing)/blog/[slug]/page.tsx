import { JsonLd, buildMetadata, jsonLd } from "@/lib/seo";
import { notFound } from "next/navigation";
import { getPost, getRelatedPosts, listPostSlugs, listPostTags } from "@/server/blog/queries";
import { PostArticle } from "../post-article";

export const revalidate = 3600;
export const dynamicParams = true;

type Props = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  const slugs = await listPostSlugs();
  return slugs.map((s) => ({ slug: s.slug }));
}

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const post = await getPost(slug);
  if (!post) return {};
  return buildMetadata({
    title: post.seoTitle ?? post.title,
    description: post.seoDescription ?? post.excerpt,
    path: `/blog/${post.slug}`,
    canonicalPath: post.canonicalUrl ?? undefined,
    type: "article",
    publishedTime: post.publishedAt ?? undefined,
    modifiedTime: post.updatedAt,
  });
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  const post = await getPost(slug);
  if (!post) notFound();
  const [related, tags] = await Promise.all([getRelatedPosts(post.id, post.categoryId, 3), listPostTags([post.id])]);
  const article = jsonLd.article({
    title: post.title,
    description: post.seoDescription ?? post.excerpt,
    path: `/blog/${post.slug}`,
    image: post.coverKey ?? undefined,
    publishedAt: post.publishedAt ?? post.updatedAt,
    updatedAt: post.updatedAt,
    authorName: post.authorName,
  });
  return <PostArticle post={post} related={related} tags={tags[post.id] ?? []} jsonLdNode={<JsonLd data={article} />} />;
}
