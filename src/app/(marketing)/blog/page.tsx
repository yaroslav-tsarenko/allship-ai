import Image from "next/image";
import Link from "next/link";
import { CategoryTabs } from "@/components/marketing/blog/category-tabs";
import { PostCard } from "@/components/marketing/blog/post-card";
import { PostMeta } from "@/components/marketing/blog/post-meta";
import { PostTags } from "@/components/marketing/blog/post-tags";
import { Breadcrumbs } from "@/components/marketing/breadcrumbs";
import { CtaBand } from "@/components/marketing/cta-band";
import { Container } from "@/components/marketing/section";
import { toolCatalog } from "@/components/marketing/tools/catalog";
import { site } from "@/content/site";
import { buildMetadata, JsonLd } from "@/lib/seo";
import { listCategories, listPosts, listPostTags } from "@/server/blog/queries";
import { RevealText } from "@/components/motion/reveal-text";
import { enter } from "@/components/motion/enter";

export const revalidate = 3600;

const path = "/blog";

export const metadata = buildMetadata({
  title: "Blog: Shipping, Moving and Trucking Guides",
  description: "Practical guides on moving, car shipping, freight and trucking: how to check a carrier, avoid scams, choose coverage and get a fair price.",
  path,
});

export default async function BlogIndex() {
  const [posts, cats] = await Promise.all([listPosts({ limit: 30 }), listCategories()]);
  const tags = await listPostTags(posts.map((p) => p.id));
  const [lead, ...rest] = posts;
  const blogLd = {
    "@context": "https://schema.org",
    "@type": "Blog",
    name: `${site.name} Blog`,
    url: new URL(path, site.url).toString(),
    publisher: { "@id": `${site.url}/#organization` },
    blogPost: posts.map((p) => ({ "@type": "BlogPosting", headline: p.title, url: new URL(`/blog/${p.slug}`, site.url).toString(), datePublished: p.publishedAt ?? undefined })),
  };
  return (
    <>
      <JsonLd data={blogLd} />
      <Container className="pt-6 pb-8 medium:pt-8">
        <Breadcrumbs items={[{ name: "Blog", path }]} />
        <h1 className="mt-10 text-display-sm font-normal tracking-tight medium:mt-14 medium:text-display-md">
          <RevealText>Blog</RevealText>
        </h1>
        <p className="mt-3 max-w-[640px] text-body-lg text-pretty text-on-surface-variant medium:text-title-lg medium:font-normal" {...enter(1)}>
          Straight answers for shippers and carriers, checked against FMCSA and industry sources.
        </p>
        <div className="mt-8" {...enter(2)}>
          <CategoryTabs categories={cats} />
        </div>
      </Container>
      <Container className="pb-16">
        {lead ? (
          <article className="group relative grid gap-6 border-y border-outline-variant py-8 medium:py-10 large:grid-cols-[1.2fr_1fr] large:items-center large:gap-12">
            {lead.coverKey && (
              <div className="relative aspect-[16/10] overflow-hidden rounded-xl">
                <Image src={lead.coverKey} alt={lead.coverAlt ?? ""} fill priority sizes="(min-width: 1200px) 640px, 100vw" className="object-cover" />
              </div>
            )}
            <div>
              {lead.categoryName && <p className="text-label-lg font-medium text-primary">{lead.categoryName}</p>}
              <h2 className="mt-2 text-headline-lg font-normal text-balance medium:text-display-sm">
                <Link href={`/blog/${lead.slug}`} className="rounded-xs after:absolute after:inset-0 group-hover:underline">
                  {lead.title}
                </Link>
              </h2>
              <p className="mt-4 text-body-lg text-pretty text-on-surface-variant">{lead.excerpt}</p>
              <PostTags tags={tags[lead.id] ?? []} className="mt-4" />
              <div className="mt-4 flex flex-wrap items-center justify-between gap-4">
                <PostMeta publishedAt={lead.publishedAt} readingMinutes={lead.readingMinutes} authorName={lead.authorName} />
                <span aria-hidden="true" className="text-label-lg font-medium text-primary">
                  Read more →
                </span>
              </div>
            </div>
          </article>
        ) : (
          <p className="border-t border-outline-variant py-16 text-body-lg text-on-surface-variant">No articles yet. New guides are on the way.</p>
        )}
        <aside aria-labelledby="blog-tools" className="mt-10 grid gap-6 rounded-lg bg-surface-container-low p-6 medium:p-8 large:grid-cols-[minmax(0,1fr)_minmax(0,2fr)] large:items-center large:gap-12">
          <div>
            <h2 id="blog-tools" className="text-headline-sm font-normal text-on-surface">
              Need a number, not an article?
            </h2>
            <p className="mt-2 text-body-lg text-on-surface-variant">Free calculators that show every assumption.</p>
          </div>
          <ul className="grid gap-x-8 gap-y-3 medium:grid-cols-2">
            {toolCatalog.map((t) => (
              <li key={t.key}>
                <Link href={t.href} className="group flex min-h-12 items-center justify-between gap-3 border-b border-outline-variant py-2">
                  <span>
                    <span className="block text-title-md text-on-surface group-hover:text-primary">{t.name}</span>
                    <span className="block text-body-md text-on-surface-variant">{t.question}</span>
                  </span>
                  <span aria-hidden="true" className="text-primary">→</span>
                </Link>
              </li>
            ))}
          </ul>
        </aside>
        {rest.length > 0 && (
          <div className="mt-10 grid gap-x-8 gap-y-12 medium:mt-12 medium:grid-cols-2 large:grid-cols-3">
            {rest.map((p) => (
              <PostCard key={p.id} post={p} tags={tags[p.id] ?? []} />
            ))}
          </div>
        )}
      </Container>
      <CtaBand title="Ready to ship?" description="Post your load once and compare bids from verified carriers. Nothing to pay until you accept one." />
    </>
  );
}
