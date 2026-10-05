import { Suspense } from "react";
import { Container } from "@/components/marketing/section";
import { ConfirmPanel } from "@/features/public-load/confirm-panel";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({ title: "Confirm your load", description: "Confirm your email to publish your load to verified carriers.", path: "/load/confirm", noindex: true });

export default function ConfirmPage() {
  return (
    <Container width="narrow" className="py-16 medium:py-24">
      <Suspense fallback={<div className="min-h-[360px]" />}>
        <ConfirmPanel />
      </Suspense>
    </Container>
  );
}
