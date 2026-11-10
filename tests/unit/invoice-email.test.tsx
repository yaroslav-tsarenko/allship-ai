import { render } from "react-email";
import { describe, expect, it } from "vitest";
import { InvoiceEmail } from "@/emails/invoice-email";

const invoice = {
  number: "INV-ZGNB7L-01A1C7",
  issuedAt: "2026-11-11T10:00:00.000Z",
  status: "paid" as const,
  method: "Card (test mode)",
  billedTo: { name: "Emily Carter", email: "emily@example.com", phone: null },
  carrier: "AppleUSA Moving",
  load: { publicId: "AS-ZGNB7L", title: "Moving from Chicago, IL to Dallas, TX", from: "Chicago, IL 60601", to: "Dallas, TX 75201", pickupDate: "2026-12-21" },
  lines: [
    { label: "Transport", detail: "AppleUSA Moving, Chicago, IL 60601 → Dallas, TX 75201", cents: 351000 },
    { label: "AllShip service fee", detail: "Escrow, support and tracking", cents: 35100 },
  ],
  totalCents: 386100,
  issuer: { name: "ALLSHIP AI INC", address: "254 Chapman Rd, Ste 209, Newark, DE 19702", email: "support@allship.ai", phone: "+1 (866) 228-2364" },
  url: "https://allship.ai/app/loads/AS-ZGNB7L/invoice",
};

describe("invoice email", () => {
  it("shows the number, every line, the total and the invoice link", async () => {
    const text = await render(<InvoiceEmail invoice={invoice} />, { plainText: true });
    expect(text).toContain("INV-ZGNB7L-01A1C7");
    expect(text).toContain("$3,510.00");
    expect(text).toContain("$351.00");
    expect(text).toContain("$3,861.00");
    expect(text).toContain("PAID");
    expect(text).toContain(invoice.url);
  });
});
