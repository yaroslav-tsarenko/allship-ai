import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PrintButton } from "@/features/loads/print-button";
import { requireShipper } from "@/features/loads/guard";
import { formatUsd } from "@/lib/money";
import { buildInvoice } from "@/server/payments/invoice";

type Props = { params: Promise<{ publicId: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { publicId } = await params;
  return { title: `Invoice ${publicId}`, robots: { index: false } };
}

const day = (iso: string) => new Intl.DateTimeFormat("en-US", { month: "long", day: "numeric", year: "numeric", timeZone: "UTC" }).format(new Date(iso));

export default async function InvoicePage({ params }: Props) {
  const { publicId } = await params;
  const { actor } = await requireShipper(publicId);
  const invoice = await buildInvoice(publicId, actor.userId);
  if (!invoice) notFound();

  return (
    <div className="mx-auto flex w-full max-w-[840px] flex-col gap-6 py-6">
      <div className="flex items-center justify-between gap-4 print:hidden">
        <Link href={`/app/loads/${publicId}`} className="text-label-lg font-medium text-primary">
          Back to {publicId}
        </Link>
        <PrintButton />
      </div>
      <article className="rounded-xl border border-outline-variant bg-surface-container-lowest p-8 text-on-surface print:border-0 print:p-0">
        <header className="flex flex-wrap items-start justify-between gap-6 border-b border-outline-variant pb-6">
          <div>
            <p className="text-title-lg">{invoice.issuer.name}</p>
            <p className="mt-1 text-body-md text-on-surface-variant">{invoice.issuer.address}</p>
            <p className="text-body-md text-on-surface-variant">
              {invoice.issuer.email} · {invoice.issuer.phone}
            </p>
          </div>
          <div className="text-right">
            <h1 className="text-headline-sm">Invoice</h1>
            <p className="mt-1 font-mono text-body-md">{invoice.number}</p>
            <p className="text-body-md text-on-surface-variant">Issued {day(invoice.issuedAt)}</p>
            <p className="mt-2 inline-flex rounded-xs bg-success-container px-2 py-0.5 text-label-md text-on-success-container">Paid · {invoice.method}</p>
          </div>
        </header>
        <section className="grid gap-6 border-b border-outline-variant py-6 medium:grid-cols-2">
          <div>
            <p className="text-label-lg text-on-surface-variant">Billed to</p>
            <p className="mt-1 text-body-lg">{invoice.billedTo.name}</p>
            <p className="text-body-md text-on-surface-variant">{invoice.billedTo.email}</p>
            {invoice.billedTo.phone && <p className="text-body-md text-on-surface-variant">{invoice.billedTo.phone}</p>}
          </div>
          <div>
            <p className="text-label-lg text-on-surface-variant">Shipment {invoice.load.publicId}</p>
            <p className="mt-1 text-body-lg">{invoice.load.title}</p>
            <p className="text-body-md text-on-surface-variant">
              {invoice.load.from} → {invoice.load.to}
            </p>
            {invoice.load.pickupDate && <p className="text-body-md text-on-surface-variant">Pickup {day(`${invoice.load.pickupDate.slice(0, 10)}T00:00:00Z`)}</p>}
          </div>
        </section>
        <table className="mt-6 w-full text-left text-body-md">
          <thead>
            <tr className="border-b border-outline-variant text-label-lg text-on-surface-variant">
              <th className="pb-2 font-medium">Description</th>
              <th className="pb-2 text-right font-medium">Amount</th>
            </tr>
          </thead>
          <tbody>
            {invoice.lines.map((l) => (
              <tr key={l.label} className="border-b border-outline-variant">
                <td className="py-3">
                  <span className="block text-on-surface">{l.label}</span>
                  <span className="block text-body-sm text-on-surface-variant">{l.detail}</span>
                </td>
                <td className="py-3 text-right tabular-nums">{formatUsd(l.cents)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <td className="pt-4 text-title-md">Total paid</td>
              <td className="pt-4 text-right text-title-lg tabular-nums">{formatUsd(invoice.totalCents)}</td>
            </tr>
          </tfoot>
        </table>
        <p className="mt-8 text-body-sm text-pretty text-on-surface-variant">
          Your payment is held in escrow and released to {invoice.carrier} after you confirm delivery, or automatically if no dispute is opened. Questions about this invoice: {invoice.issuer.email}.
        </p>
      </article>
    </div>
  );
}
