import type { Metadata } from "next";
import { site } from "@/content/site";

export const metadata: Metadata = { title: "Square connection", robots: { index: false, follow: false } };

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

const copy: Record<string, { title: string; body: string }> = {
  connected: { title: "Square is connected", body: "AllShip AI can now take booking payments into your Square account. You can close this page. To disconnect at any time, open Square Dashboard → Account & Settings → App integrations." },
  denied: { title: "Connection cancelled", body: "Nothing was connected. Open the link again if you want to try once more." },
  expired: { title: "This link has expired", body: "Ask the AllShip AI team for a new connection link." },
  already: { title: "Square is already connected", body: "A Square account is already linked to AllShip AI. Ask the team if you need to change it." },
  unavailable: { title: "Square isn't set up yet", body: "The AllShip AI team still needs to finish the Square setup. Try again later." },
  failed: { title: "We couldn't connect Square", body: "Square didn't confirm the connection. Try the link again, or contact us." },
};

export default async function SquareConnectedPage({ searchParams }: Props) {
  const raw = (await searchParams).status;
  const status = typeof raw === "string" && raw in copy ? raw : "failed";
  const { title, body } = copy[status]!;
  return (
    <section className="mx-auto w-full max-w-[760px] px-4 py-16 medium:px-8 medium:py-24">
      <p className="text-title-sm font-medium text-primary">Payments</p>
      <h1 className="mt-4 text-headline-lg text-balance medium:text-display-sm">{title}</h1>
      <p className="mt-4 text-body-lg text-on-surface-variant">{body}</p>
      {status === "failed" ? (
        <p className="mt-4 text-body-lg">
          <a href={`mailto:${site.email}?subject=Square connection`} className="text-primary underline underline-offset-2">
            {site.email}
          </a>
        </p>
      ) : null}
    </section>
  );
}
