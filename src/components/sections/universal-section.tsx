import Image from "next/image";
import Link from "next/link";
import { legacyAlt, roleBroker, roleCarrier, roleDispatch, roleShipper, roleTruck } from "@/assets/legacy";
import { Container } from "@/components/marketing/section";
import { Icon } from "@/components/ui/icon";
import { arrowForwardIcon } from "@/components/ui/icons.generated";
import { authLinks } from "@/content/site";
import { cn } from "@/lib/cn";
import { FlipPanel } from "./flip-panel";
import { SectionHeader } from "./section-header";
import { sectionId, type SectionImage } from "./types";

export type RoleItem = { title: string; description: string; image: SectionImage; href?: string; linkLabel?: string };

export const defaultRoles: RoleItem[] = [
  { title: "Shipper", description: "Shippers post their loads and carriers bid on them.", image: { src: roleShipper, alt: legacyAlt.roleShipper }, href: authLinks.signUp.href, linkLabel: "Sign up as a shipper" },
  { title: "Carrier", description: "Carriers browse available loads and place bids to transport them.", image: { src: roleCarrier, alt: legacyAlt.roleCarrier }, href: authLinks.carrierSignUp.href, linkLabel: "Sign up as a carrier" },
  { title: "Broker", description: "Brokers connect shippers and carriers and keep each transaction running smoothly.", image: { src: roleBroker, alt: legacyAlt.roleBroker }, href: "/partners", linkLabel: "Partner with us" },
  { title: "Dispatch", description: "Dispatchers coordinate the logistics and make sure loads are delivered on time.", image: { src: roleDispatch, alt: legacyAlt.roleDispatch }, href: "/partners#dispatch", linkLabel: "About dispatch" },
];

const roleTones = ["bg-primary-container text-on-primary-container", "bg-secondary-container text-on-secondary-container", "bg-tertiary-container text-on-tertiary-container", "bg-surface-container-high text-on-surface"];

export function UniversalSection({
  title = "Choose your role",
  description = "AllShip AI is a platform that connects shippers and carriers. Shippers post their loads and carriers bid on them. Here are the roles you can choose from.",
  roles = defaultRoles,
  showTruck = true,
  id,
}: {
  title?: string;
  description?: string;
  roles?: RoleItem[];
  showTruck?: boolean;
  id?: string;
}) {
  const headingId = id ?? sectionId("roles", title);
  return (
    <section aria-labelledby={headingId} className="overflow-hidden py-16 medium:py-24">
      <Container>
        <SectionHeader id={headingId} title={title} description={description} className="mb-12" />
        <ul className="grid gap-3 medium:grid-cols-2 large:grid-cols-4">
          {roles.map((role, i) => (
            <li key={role.title} className={cn("flex min-h-[340px] flex-col overflow-hidden rounded-xl p-6 medium:min-h-[420px]", roleTones[i % roleTones.length])}>
              <h3 className="text-headline-sm">{role.title}</h3>
              <FlipPanel
                front={
                  <div className="relative mt-4 -mb-6 flex flex-1 items-end justify-center">
                    <Image
                      src={role.image.src}
                      alt={role.image.alt}
                      width={typeof role.image.src === "string" ? (role.image.width ?? 600) : undefined}
                      height={typeof role.image.src === "string" ? (role.image.height ?? 600) : undefined}
                      sizes="(min-width: 1200px) 280px, (min-width: 600px) 45vw, 90vw"
                      className="h-[220px] w-auto object-contain object-bottom medium:h-[280px]"
                    />
                  </div>
                }
                back={
                  <div className="mt-4 flex flex-1 flex-col">
                    <p className="text-title-lg text-pretty">{role.description}</p>
                    {role.href && (
                      <Link href={role.href} className="mt-auto inline-flex items-center gap-1 self-start rounded-xs pt-6 text-label-lg font-medium underline-offset-4 hover:underline">
                        {role.linkLabel ?? `Continue as ${role.title.toLowerCase()}`}
                        <Icon icon={arrowForwardIcon} size={18} />
                      </Link>
                    )}
                  </div>
                }
                openLabel={`More about the ${role.title.toLowerCase()} role`}
                closeLabel={`Close ${role.title.toLowerCase()} details`}
                openText="More"
                closeText="Close"
                buttonClassName="state-layer absolute top-[-44px] right-0 inline-flex h-10 cursor-pointer items-center rounded-[20px] border border-current/40 bg-surface px-5 text-label-lg font-medium text-on-surface transition-[border-radius] duration-(--duration-short4) active:rounded-[12px]"
              />
            </li>
          ))}
        </ul>
        {showTruck && (
          <figure aria-hidden="true" className="mt-10 overflow-hidden">
            <Image src={roleTruck} alt="" className="h-auto w-full max-w-none" />
          </figure>
        )}
      </Container>
    </section>
  );
}
