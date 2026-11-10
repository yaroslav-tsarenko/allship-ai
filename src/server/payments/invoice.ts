import "server-only";
import { and, eq } from "drizzle-orm";
import { createElement } from "react";
import { env } from "@/env";
import { site } from "@/content/site";
import { InvoiceEmail } from "@/emails/invoice-email";
import { db } from "@/server/db/client";
import { load, organization, payment, user } from "@/server/db/schema";
import { sendEmail } from "@/server/email/send";
import { simulatedPayments } from "./stripe";

export type Invoice = {
  number: string;
  issuedAt: string;
  status: "paid" | "pending";
  method: string;
  billedTo: { name: string; email: string; phone: string | null };
  carrier: string;
  load: { publicId: string; title: string; from: string; to: string; pickupDate: string | null };
  lines: Array<{ label: string; detail: string; cents: number }>;
  totalCents: number;
  issuer: { name: string; address: string; email: string; phone: string };
  url: string;
};

const place = (s: { city?: string; state?: string; postalCode?: string | null }) => [s.city, [s.state, s.postalCode].filter(Boolean).join(" ")].filter(Boolean).join(", ");

export function invoiceNumber(publicId: string, paymentId: string) {
  return `INV-${publicId.replace(/^AS-/, "")}-${paymentId.replace(/-/g, "").slice(0, 6).toUpperCase()}`;
}

export async function buildInvoice(loadPublicId: string, shipperId?: string): Promise<Invoice | null> {
  const where = shipperId ? and(eq(load.publicId, loadPublicId), eq(load.shipperId, shipperId)) : eq(load.publicId, loadPublicId);
  const [row] = await db
    .select({ load, payment, shipper: { name: user.name, email: user.email, phone: user.phone }, carrier: organization.name })
    .from(load)
    .innerJoin(payment, eq(payment.loadId, load.id))
    .innerJoin(user, eq(user.id, load.shipperId))
    .leftJoin(organization, eq(organization.id, load.carrierOrgId))
    .where(and(where, eq(payment.status, "succeeded")))
    .limit(1);
  if (!row) return null;
  const p = row.payment;
  const a = site.address;
  return {
    number: invoiceNumber(row.load.publicId, p.id),
    issuedAt: (p.updatedAt ?? p.createdAt).toISOString(),
    status: "paid",
    method: p.stripePaymentIntentId ? "Card via Stripe" : simulatedPayments() ? "Card (test mode)" : "Card",
    billedTo: { name: row.shipper.name, email: row.shipper.email, phone: row.shipper.phone },
    carrier: row.carrier ?? "Carrier",
    load: { publicId: row.load.publicId, title: row.load.title, from: place(row.load.pickup), to: place(row.load.dropoff), pickupDate: row.load.pickup.windowStart ?? null },
    lines: [
      { label: "Transport", detail: `${row.carrier ?? "Carrier"}, ${place(row.load.pickup)} → ${place(row.load.dropoff)}`, cents: p.carrierAmountCents },
      { label: "AllShip service fee", detail: "Escrow, support and tracking", cents: p.platformFeeCents },
    ],
    totalCents: p.amountCents,
    issuer: { name: site.legalName, address: `${a.street}, ${a.city}, ${a.region} ${a.postalCode}`, email: site.email, phone: site.phone.display },
    url: `${env.NEXT_PUBLIC_APP_URL}/app/loads/${row.load.publicId}/invoice`,
  };
}

export async function sendInvoice(loadPublicId: string) {
  const invoice = await buildInvoice(loadPublicId);
  if (!invoice) return;
  await sendEmail({ to: invoice.billedTo.email, subject: `Invoice ${invoice.number} · ${invoice.load.title}`, react: createElement(InvoiceEmail, { invoice }), tag: "invoice", category: "transactional" });
}
