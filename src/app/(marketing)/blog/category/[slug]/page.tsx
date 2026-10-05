import { notFound } from "next/navigation";
import { CategoryTabs } from "@/components/marketing/blog/category-tabs";
import { PostCard } from "@/components/marketing/blog/post-card";
import { Breadcrumbs } from "@/components/marketing/breadcrumbs";
import { Container, Section } from "@/components/marketing/section";
import { buildMetadata } from "@/lib/seo";
import { listCategories, listPosts, listPostTags } from "@/server/blog/queries";
import { RevealText } from "@/components/motion/reveal-text";
import { enter } from "@/components/motion/enter";

export const revalidate = 3600;

type Props = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  const cats = await listCategories();
  return cats.map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const cat = (await listCategories()).find((c) => c.slug === slug);
  if (!cat) return {};
  return buildMetadata({ title: `${cat.name} guides`, description: cat.description ?? `AllShip AI guides about ${cat.name.toLowerCase()}.`, path: `/blog/category/${slug}` });
}

export default async function BlogCategoryPage({ params }: Props) {
  const { slug } = await params;
  const cats = await listCategories();
  const cat = cats.find((c) => c.slug === slug);
  if (!cat) notFound();
  const posts = await listPosts({ categorySlug: slug, limit: 50 });
  const tags = await listPostTags(posts.map((p) => p.id));
  return (
    <>
      <Section spacing="md" className="pb-6 medium:pb-8">
        <Breadcrumbs items={[{ name: "Blog", path: "/blog" }, { name: cat.name, path: `/blog/category/${slug}` }]} />
        <h1 className="mt-6 text-display-sm font-normal">
          <RevealText>{cat.name} guides</RevealText>
        </h1>
        {cat.description && (
          <p className="mt-3 max-w-[640px] text-body-lg text-on-surface-variant" {...enter(1)}>
            {cat.description}
          </p>
        )}
        <div className="mt-8" {...enter(2)}>
          <CategoryTabs categories={cats} active={slug} />
        </div>
      </Section>
      <Container className="pb-20">
        {posts.length === 0 && <p className="py-12 text-body-lg text-on-surface-variant">No guides in this topic yet.</p>}
        {posts.length > 0 && (
          <div className="grid gap-x-8 gap-y-12 border-t border-outline-variant pt-10 medium:grid-cols-2 large:grid-cols-3">
            {posts.map((p) => (
              <PostCard key={p.id} post={p} tags={tags[p.id] ?? []} />
            ))}
          </div>
        )}
      </Container>
    </>
  );
}
