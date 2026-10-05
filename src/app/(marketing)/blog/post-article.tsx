import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { PostMeta, formatPostDate } from "@/components/marketing/blog/post-meta";
import { PostCard } from "@/components/marketing/blog/post-card";
import { PostTags } from "@/components/marketing/blog/post-tags";
import { Breadcrumbs } from "@/components/marketing/breadcrumbs";
import { Faq } from "@/components/marketing/faq";
import { QuoteWidget } from "@/components/marketing/quote-widget";
import { Container } from "@/components/marketing/section";
import { site } from "@/content/site";
import { renderMarkdown } from "@/server/blog/markdown";
import type { getPost, PostListItem } from "@/server/blog/queries";
import { RevealText } from "@/components/motion/reveal-text";
import { enter } from "@/components/motion/enter";
import { SectionProgress } from "@/components/motion/scroll";
import { toolCatalog } from "@/components/marketing/tools/catalog";

export type PublicPost = NonNullable<Awaited<ReturnType<typeof getPost>>>;

const quoteCategoryFor: Record<string, string> = { moving: "long-distance-moving", "car-shipping": "car-or-light-truck", freight: "freight" };

export function PostArticle({ post, related, tags = [], jsonLdNode, banner }: { post: PublicPost; related: PostListItem[]; tags?: string[]; jsonLdNode?: ReactNode; banner?: ReactNode }) {
  const { html, toc } = renderMarkdown(post.body.markdown);
  const path = `/blog/${post.slug}`;
  const updated = new Date(post.updatedAt).getTime() - (post.publishedAt ? new Date(post.publishedAt).getTime() : 0) > 1000 * 60 * 60 * 24;
  const isCarrier = post.categorySlug === "carriers";

  return (
    <article>
      <div className="pointer-events-none sticky top-16 z-20 h-0.5">
        <SectionProgress target="#article-body" />
      </div>
      {banner}
      {jsonLdNode}
      <Container width="narrow" className="pt-8 medium:pt-12">
        <Breadcrumbs
          items={[
            { name: "Blog", path: "/blog" },
            ...(post.categorySlug && post.categoryName ? [{ name: post.categoryName, path: `/blog/category/${post.categorySlug}` }] : []),
            { name: post.title, path },
          ]}
        />
        <h1 className="mt-6 text-display-sm font-normal text-balance medium:text-display-md">
          <RevealText>{post.title}</RevealText>
        </h1>
        <p className="mt-5 text-body-lg text-pretty text-on-surface-variant medium:text-title-lg medium:font-normal" {...enter(2)}>
          {post.excerpt}
        </p>
        <div className="mt-6 flex flex-wrap items-center gap-x-4 gap-y-1" {...enter(3)}>
          <PostMeta publishedAt={post.publishedAt} readingMinutes={post.readingMinutes} authorName={post.authorName} />
          {updated && <p className="text-body-md text-on-surface-variant">Updated {formatPostDate(post.updatedAt)}</p>}
        </div>
        <PostTags tags={tags} className="mt-3" />
      </Container>
      {post.coverKey && (
        <Container className="mt-10">
          <div className="relative aspect-[16/9] overflow-hidden rounded-xl medium:aspect-[21/9]" {...enter(4)}>
            <Image src={post.coverKey} alt={post.coverAlt ?? ""} fill priority sizes="(min-width: 1280px) 1216px, 100vw" className="object-cover" />
          </div>
        </Container>
      )}
      <Container className="mt-12 pb-16">
        <div className="grid gap-12 large:grid-cols-[240px_minmax(0,720px)_1fr]">
          <aside className="hidden large:block">
            {toc.length > 0 && (
              <nav aria-label="On this page" className="sticky top-24">
                <p className="mb-3 text-title-sm text-on-surface">On this page</p>
                <ul className="flex flex-col gap-2 border-l border-outline-variant">
                  {toc
                    .filter((t) => t.level === 2)
                    .map((t) => (
                      <li key={t.id}>
                        <a href={`#${t.id}`} className="-ml-px block border-l-2 border-transparent pl-4 text-body-md text-on-surface-variant hover:border-primary hover:text-on-surface">
                          {t.text}
                        </a>
                      </li>
                    ))}
                </ul>
              </nav>
            )}
          </aside>
          <div className="min-w-0">
            <div id="article-body" className="prose-article" dangerouslySetInnerHTML={{ __html: html }} />
            {post.faq.length > 0 && (
              <section aria-labelledby="faq-title" className="mt-16">
                <h2 id="faq-title" className="mb-4 text-headline-sm font-normal">
                  Frequently asked questions
                </h2>
                <Faq items={post.faq} />
              </section>
            )}
            <aside className="mt-16 rounded-xl bg-surface-container-low p-6 medium:p-8">
              {isCarrier ? (
                <>
                  <p className="text-headline-sm font-normal">Haul loads that are already paid for</p>
                  <p className="mt-2 text-body-lg text-on-surface-variant">Verify your USDOT and MC once, bid on loads in your lanes, and get paid after delivery.</p>
                  <Link href="/sign-up?type=carrier" className="mt-6 inline-flex h-12 items-center rounded-full bg-primary px-6 text-label-lg font-medium text-on-primary">
                    Join as a carrier
                  </Link>
                </>
              ) : (
                <>
                  <p className="text-headline-sm font-normal">Get bids from verified carriers</p>
                  <p className="mt-2 mb-6 text-body-lg text-on-surface-variant">
                    Post once, compare bids, and pay into escrow. The carrier is paid after you confirm delivery. Questions? Call {site.phone.display}.
                  </p>
                  <QuoteWidget layout="stack" source={`blog-${post.slug}`} defaultCategory={quoteCategoryFor[post.categorySlug ?? ""]} />
                  <p className="mt-6 border-t border-outline-variant pt-4 text-body-md text-on-surface-variant">
                    Want a ballpark first? Try the{" "}
                    {toolCatalog.slice(0, 2).map((t, i) => (
                      <span key={t.key}>
                        {i > 0 && " or the "}
                        <Link href={t.href} className="text-primary underline-offset-4 hover:underline">
                          {t.name.toLowerCase()}
                        </Link>
                      </span>
                    ))}
                    .
                  </p>
                </>
              )}
            </aside>
          </div>
        </div>
      </Container>
      {related.length > 0 && (
        <section aria-labelledby="related-title" className="border-t border-outline-variant bg-surface-container-low py-14">
          <Container>
            <h2 id="related-title" className="text-headline-sm font-normal">
              Keep reading
            </h2>
            <div className="mt-8 grid gap-x-8 gap-y-12 medium:grid-cols-2 large:grid-cols-3">
              {related.map((p) => (
                <PostCard key={p.id} post={p} headingLevel="h3" />
              ))}
            </div>
          </Container>
        </section>
      )}
    </article>
  );
}
