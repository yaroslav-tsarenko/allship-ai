import Image from "next/image";
import Link from "next/link";
import type { PostListItem } from "@/server/blog/queries";
import { PostMeta } from "./post-meta";
import { PostTags } from "./post-tags";

export function PostCard({ post, tags = [], headingLevel = "h2" }: { post: PostListItem; tags?: string[]; headingLevel?: "h2" | "h3" }) {
  const Heading = headingLevel;
  return (
    <article className="group relative flex flex-col">
      <div className="relative aspect-[16/10] overflow-hidden rounded-md bg-surface-container">
        {post.coverKey && (
          <Image
            src={post.coverKey}
            alt={post.coverAlt ?? ""}
            fill
            sizes="(min-width: 1280px) 400px, (min-width: 840px) 33vw, (min-width: 600px) 50vw, 100vw"
            className="object-cover transition-transform duration-(--duration-medium2) ease-(--ease-standard) group-hover:scale-[1.02] motion-reduce:transition-none motion-reduce:group-hover:scale-100"
          />
        )}
      </div>
      {post.categoryName && <p className="mt-4 text-label-lg font-medium text-primary">{post.categoryName}</p>}
      <Heading className="mt-1 text-title-lg text-balance text-on-surface medium:text-headline-sm">
        <Link href={`/blog/${post.slug}`} className="rounded-xs after:absolute after:inset-0 group-hover:underline">
          {post.title}
        </Link>
      </Heading>
      <p className="mt-2 line-clamp-3 text-body-md text-pretty text-on-surface-variant">{post.excerpt}</p>
      <PostTags tags={tags} className="mt-3" />
      <span aria-hidden="true" className="block h-4" />
      <div className="mt-auto flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 border-t border-outline-variant pt-3">
        <PostMeta publishedAt={post.publishedAt} readingMinutes={post.readingMinutes} />
        <span aria-hidden="true" className="text-label-lg font-medium text-primary">
          Read →
        </span>
      </div>
    </article>
  );
}
