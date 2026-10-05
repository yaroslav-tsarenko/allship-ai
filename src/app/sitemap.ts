import type { MetadataRoute } from "next";
import { categories, hubCanonical } from "@/content/categories";
import { marketingRoutes } from "@/content/routes";
import { site } from "@/content/site";
import { listCategories, listPostSlugs } from "@/server/blog/queries";

export const revalidate = 3600;

export async function generateSitemaps() {
  return [{ id: "pages" }, { id: "services" }, { id: "blog" }];
}

const abs = (path: string) => new URL(path, site.url).toString();

export default async function sitemap(props: { id: Promise<string> }): Promise<MetadataRoute.Sitemap> {
  const id = await props.id;
  if (id === "pages") {
    return marketingRoutes.map((r) => ({ url: abs(r.path), changeFrequency: r.changeFrequency, priority: r.priority }));
  }
  if (id === "services") {
    return categories.filter((c) => !hubCanonical[c.key]).map((c) => ({ url: abs(`/services/${c.slug}`), changeFrequency: "monthly", priority: 0.8, images: [abs(c.image.src)] }));
  }
  const [posts, cats] = await Promise.all([listPostSlugs(), listCategories()]);
  return [
    ...posts.map((p) => ({ url: abs(`/blog/${p.slug}`), lastModified: p.updatedAt, changeFrequency: "monthly" as const, priority: 0.7 })),
    ...cats.map((c) => ({ url: abs(`/blog/category/${c.slug}`), changeFrequency: "weekly" as const, priority: 0.5 })),
  ];
}
