import Image from "next/image";
import { badgeAngi, badgeBbb, badgeGoogle, badgeHomeAdvisor, badgeThumbtack, badgeTrustpilot, badgeYellowPages, badgeYelp } from "@/assets/legacy";
import { Container } from "@/components/marketing/section";
import { Icon } from "@/components/ui/icon";
import { openInNewIcon } from "@/components/ui/icons.generated";
import { site, type ReviewProfile } from "@/content/site";
import { getPartnerLogos } from "@/server/showcase/queries";
import { SectionHeader } from "./section-header";
import { sectionId } from "./types";

const badges: Record<ReviewProfile["badge"], typeof badgeAngi> = {
  angi: badgeAngi,
  bbb: badgeBbb,
  google: badgeGoogle,
  homeAdvisor: badgeHomeAdvisor,
  thumbtack: badgeThumbtack,
  trustpilot: badgeTrustpilot,
  yellowPages: badgeYellowPages,
  yelp: badgeYelp,
};

export async function TrustCompanies({ title = "Companies we work with", profilesTitle = "Find our reviews on", description, id }: { title?: string; profilesTitle?: string; description?: string; id?: string }) {
  const logos = await getPartnerLogos();
  const profiles: readonly ReviewProfile[] = site.reviewProfiles;
  if (!logos.length && !profiles.length) return null;
  const headingId = id ?? sectionId("trust", title);
  return (
    <section aria-labelledby={headingId} className="py-14 medium:py-20">
      <Container>
        <SectionHeader id={headingId} title={logos.length ? title : profilesTitle} description={description} className="mb-10" />
        {logos.length > 0 && (
          <ul className="grid grid-cols-2 border-t border-l border-outline-variant medium:grid-cols-3 large:grid-cols-6">
            {logos.map((logo) => {
              const body = (
                <>
                  <Image src={logo.imageUrl} alt={logo.name} width={140} height={40} unoptimized className="h-10 w-auto max-w-[140px] object-contain dark:brightness-0 dark:invert" />
                  <span className="text-body-sm text-on-surface-variant">{logo.relationship}</span>
                </>
              );
              return (
                <li key={logo.id} className="border-r border-b border-outline-variant">
                  {logo.href ? (
                    <a href={logo.href} target="_blank" rel="noopener noreferrer" className="state-layer flex h-full flex-col items-center justify-center gap-3 px-4 py-8 text-center">
                      {body}
                    </a>
                  ) : (
                    <div className="flex h-full flex-col items-center justify-center gap-3 px-4 py-8 text-center">{body}</div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
        {profiles.length > 0 && (
          <div className={logos.length ? "mt-12" : ""}>
            {logos.length > 0 && <h3 className="mb-4 text-title-md text-on-surface">{profilesTitle}</h3>}
            <ul className="flex flex-wrap gap-3">
              {profiles.map((p) => (
                <li key={p.href}>
                  <a href={p.href} target="_blank" rel="noopener noreferrer" className="state-layer inline-flex h-14 items-center gap-3 rounded-md border border-outline-variant pr-4 pl-3 text-title-sm text-on-surface">
                    <Image src={badges[p.badge]} alt="" className="h-8 w-8 object-contain" sizes="32px" />
                    {p.name}
                    <Icon icon={openInNewIcon} size={16} className="text-on-surface-variant" />
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}
      </Container>
    </section>
  );
}
