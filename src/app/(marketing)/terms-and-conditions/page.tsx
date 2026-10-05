import { LegalDocument } from "@/components/marketing/legal/legal-document";
import { termsDescription, termsSections, termsSummary } from "@/components/pages/legal/terms";
import { buildMetadata } from "@/lib/seo";

const path = "/terms-and-conditions";

export const metadata = buildMetadata({
  title: "Terms and Conditions",
  description: termsDescription,
  path,
});

export default function Page() {
  return <LegalDocument path={path} crumb="Terms and Conditions" title="Terms and Conditions" summary={termsSummary} sections={termsSections} />;
}
