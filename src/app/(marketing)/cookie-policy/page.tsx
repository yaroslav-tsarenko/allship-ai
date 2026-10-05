import { LegalDocument } from "@/components/marketing/legal/legal-document";
import { cookieDescription, cookieSections, cookieSummary } from "@/components/pages/legal/cookies";
import { buildMetadata } from "@/lib/seo";

const path = "/cookie-policy";

export const metadata = buildMetadata({
  title: "Cookie Policy",
  description: cookieDescription,
  path,
});

export default function Page() {
  return <LegalDocument path={path} crumb="Cookie Policy" title="Cookie Policy" summary={cookieSummary} sections={cookieSections} />;
}
