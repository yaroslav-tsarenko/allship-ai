import { ogSize, renderOgImage } from "@/lib/og/render";
import { getPost } from "@/server/blog/queries";

export const size = ogSize;
export const contentType = "image/png";
export const alt = "AllShip AI guide";

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = await getPost(slug);
  return renderOgImage({ eyebrow: post?.categoryName ? `${post.categoryName} guide` : "AllShip AI guide", title: post?.title ?? "Shipping and moving guides", footer: "allship.ai/blog" });
}
