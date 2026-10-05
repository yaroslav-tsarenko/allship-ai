import { LegalDocument } from "@/components/marketing/legal/legal-document";
import { privacyDescription, privacySections, privacySummary } from "@/components/pages/legal/privacy";
import { buildMetadata } from "@/lib/seo";

const path = "/privacy-policy";

export const metadata = buildMetadata({
  title: "Privacy Policy",
  description: privacyDescription,
  path,
});

export default function Page() {
  return <LegalDocument path={path} crumb="Privacy Policy" title="Privacy Policy" summary={privacySummary} sections={privacySections} />;
}
