import { Button, Column, Row, Section, Text } from "react-email";
import type { Invoice } from "@/server/payments/invoice";
import { EmailLayout, emailStyles } from "./layout";

const usd = (cents: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(cents / 100);
const day = (iso: string) => new Intl.DateTimeFormat("en-US", { month: "long", day: "numeric", year: "numeric", timeZone: "UTC" }).format(new Date(iso));
const cell = { fontSize: "14px", lineHeight: "20px", color: "#43474e", margin: 0 } as const;
const strong = { ...cell, color: "#1a1c20", fontWeight: 500 } as const;

export function InvoiceEmail({ invoice }: { invoice: Invoice }) {
  return (
    <EmailLayout preview={`Invoice ${invoice.number}: ${usd(invoice.totalCents)} paid, held in escrow until delivery`}>
      <Text style={emailStyles.h1}>Thanks, your move is booked</Text>
      <Text style={emailStyles.p}>
        We received {usd(invoice.totalCents)} for {invoice.load.publicId}. The money stays in escrow and goes to {invoice.carrier} only after you confirm delivery.
      </Text>
      <Section style={{ border: "1px solid #dfe2eb", borderRadius: "12px", padding: "20px", margin: "8px 0 24px" }}>
        <Row>
          <Column>
            <Text style={strong}>Invoice {invoice.number}</Text>
            <Text style={cell}>Issued {day(invoice.issuedAt)}</Text>
          </Column>
          <Column align="right">
            <Text style={{ ...strong, color: "#146c2e" }}>PAID</Text>
            <Text style={cell}>{invoice.method}</Text>
          </Column>
        </Row>
        <Text style={{ ...cell, marginTop: "16px" }}>
          Billed to {invoice.billedTo.name} · {invoice.billedTo.email}
        </Text>
        <Text style={cell}>
          {invoice.load.from} → {invoice.load.to}
          {invoice.load.pickupDate ? ` · pickup ${day(`${invoice.load.pickupDate.slice(0, 10)}T00:00:00Z`)}` : ""}
        </Text>
        {invoice.lines.map((l) => (
          <Row key={l.label} style={{ borderTop: "1px solid #dfe2eb", marginTop: "12px", paddingTop: "12px" }}>
            <Column>
              <Text style={strong}>{l.label}</Text>
              <Text style={cell}>{l.detail}</Text>
            </Column>
            <Column align="right">
              <Text style={strong}>{usd(l.cents)}</Text>
            </Column>
          </Row>
        ))}
        <Row style={{ borderTop: "1px solid #1a1c20", marginTop: "12px", paddingTop: "12px" }}>
          <Column>
            <Text style={{ ...strong, fontSize: "16px" }}>Total paid</Text>
          </Column>
          <Column align="right">
            <Text style={{ ...strong, fontSize: "16px" }}>{usd(invoice.totalCents)}</Text>
          </Column>
        </Row>
      </Section>
      <Button href={invoice.url} style={emailStyles.button}>
        View or download invoice
      </Button>
      <Text style={{ ...emailStyles.p, marginTop: "24px", fontSize: "14px" }}>
        {invoice.issuer.name} · {invoice.issuer.address} · {invoice.issuer.email} · {invoice.issuer.phone}
      </Text>
    </EmailLayout>
  );
}

export default InvoiceEmail;
