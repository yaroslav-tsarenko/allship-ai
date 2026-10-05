import type { Metadata } from "next";
import { NotFoundView } from "@/components/feedback/not-found-view";

export const metadata: Metadata = { title: "Page not found", robots: { index: false, follow: true } };

export default function MarketingNotFound() {
  return <NotFoundView title="We couldn't find that page" />;
}
