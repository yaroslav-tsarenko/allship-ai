import "server-only";
import { asc, desc, eq } from "drizzle-orm";
import { updateTag } from "next/cache";
import type { PartnerLogoInput, TestimonialInput } from "@/features/admin/showcase/schema";
import { db } from "@/server/db/client";
import { auditLog, partnerLogo, testimonial } from "@/server/db/schema";
import { SHOWCASE_TAG } from "./queries";

async function refresh(actorId: string, action: string, entity: string, entityId: string, diff: Record<string, unknown> = {}) {
  updateTag(SHOWCASE_TAG);
  await db.insert(auditLog).values({ actorId, action, entity, entityId, diff });
}

export async function listShowcase() {
  const [testimonials, logos] = await Promise.all([
    db.select().from(testimonial).orderBy(desc(testimonial.published), asc(testimonial.sort), desc(testimonial.createdAt)),
    db.select().from(partnerLogo).orderBy(desc(partnerLogo.published), asc(partnerLogo.sort), asc(partnerLogo.name)),
  ]);
  return { testimonials, logos };
}

export async function saveTestimonial(actorId: string, input: TestimonialInput) {
  const values = {
    quote: input.quote,
    authorName: input.authorName,
    authorDetail: input.authorDetail || null,
    rating: input.rating,
    sourceLabel: input.sourceLabel,
    sourceUrl: input.sourceUrl || null,
    reviewedAt: input.reviewedAt ? new Date(`${input.reviewedAt}T00:00:00Z`) : null,
    audience: input.audience,
    placements: input.placements,
    published: input.published,
    sort: input.sort,
  };
  const [row] = input.id
    ? await db.update(testimonial).set({ ...values, updatedAt: new Date() }).where(eq(testimonial.id, input.id)).returning({ id: testimonial.id })
    : await db.insert(testimonial).values(values).returning({ id: testimonial.id });
  if (row) await refresh(actorId, input.id ? "testimonial.update" : "testimonial.create", "testimonial", row.id, { published: input.published, sourceUrl: input.sourceUrl });
  return row ?? null;
}

export async function deleteTestimonial(actorId: string, id: string) {
  await db.delete(testimonial).where(eq(testimonial.id, id));
  await refresh(actorId, "testimonial.delete", "testimonial", id);
}

export async function savePartnerLogo(actorId: string, input: PartnerLogoInput) {
  const values = { name: input.name, imageKey: input.imageUrl, href: input.href || null, relationship: input.relationship, published: input.published, sort: input.sort };
  const [row] = input.id
    ? await db.update(partnerLogo).set(values).where(eq(partnerLogo.id, input.id)).returning({ id: partnerLogo.id })
    : await db.insert(partnerLogo).values(values).returning({ id: partnerLogo.id });
  if (row) await refresh(actorId, input.id ? "partner_logo.update" : "partner_logo.create", "partner_logo", row.id, { published: input.published });
  return row ?? null;
}

export async function deletePartnerLogo(actorId: string, id: string) {
  await db.delete(partnerLogo).where(eq(partnerLogo.id, id));
  await refresh(actorId, "partner_logo.delete", "partner_logo", id);
}
