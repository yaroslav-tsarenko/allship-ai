import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { config } from "dotenv";
import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import matter from "gray-matter";
import postgres from "postgres";
import * as schema from "../src/server/db/schema";

config({ path: ".env.local" });
config();

const url = process.env.DATABASE_URL_MIGRATIONS ?? process.env.DATABASE_URL;
if (!url) throw new Error("DATABASE_URL_MIGRATIONS or DATABASE_URL is required");
const client = postgres(url, { max: 1, prepare: false });
const db = drizzle(client, { schema, casing: "snake_case" });

const categories = [
  { slug: "moving", name: "Moving", description: "Plan, price and protect a household or office move." },
  { slug: "car-shipping", name: "Car shipping", description: "Ship cars, motorcycles, boats and RVs with fewer surprises." },
  { slug: "freight", name: "Freight", description: "LTL, full truckload, freight class and paperwork." },
  { slug: "carriers", name: "For carriers", description: "Win better loads and get paid on time." },
];

const EDITORIAL_ID = "allship-editorial";

async function main() {
  const [author] = await db.select({ id: schema.user.id }).from(schema.user).where(eq(schema.user.id, EDITORIAL_ID)).limit(1);
  if (!author) {
    await db.insert(schema.user).values({ id: EDITORIAL_ID, name: "AllShip Editorial Team", email: "editorial@allship.ai", emailVerified: true, accountType: "shipper", role: "user", onboardingCompletedAt: new Date() });
  }

  const categoryIds = new Map<string, string>();
  for (const c of categories) {
    const [row] = await db
      .insert(schema.postCategory)
      .values(c)
      .onConflictDoUpdate({ target: schema.postCategory.slug, set: { name: c.name, description: c.description } })
      .returning({ id: schema.postCategory.id });
    if (row) categoryIds.set(c.slug, row.id);
  }

  const dir = join(process.cwd(), "content/blog");
  const files = readdirSync(dir).filter((f) => f.endsWith(".md"));
  for (const file of files) {
    const slug = file.replace(/\.md$/, "");
    const { data, content } = matter(readFileSync(join(dir, file), "utf8"));
    const words = content.split(/\s+/).filter(Boolean).length;
    const values = {
      slug,
      title: String(data.title),
      excerpt: String(data.excerpt),
      body: { markdown: content.trim() },
      coverKey: data.coverImage ? String(data.coverImage) : null,
      coverAlt: data.coverAlt ? String(data.coverAlt) : null,
      categoryId: categoryIds.get(String(data.category)) ?? null,
      authorId: EDITORIAL_ID,
      status: "published" as const,
      publishedAt: new Date(`${(data.publishedAt instanceof Date ? data.publishedAt.toISOString() : String(data.publishedAt)).slice(0, 10)}T14:00:00Z`),
      seoTitle: data.seoTitle ? String(data.seoTitle) : null,
      seoDescription: data.description ? String(data.description) : null,
      faq: Array.isArray(data.faq) ? (data.faq as Array<{ q: string; a: string }>).map((f) => ({ question: f.q, answer: f.a })) : [],
      readingMinutes: Math.max(1, Math.round(words / 230)),
    };
    await db.insert(schema.post).values(values).onConflictDoUpdate({ target: schema.post.slug, set: { ...values, updatedAt: new Date() } });
    console.log(`seeded ${slug}`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => client.end());
