"use client";

import { Icon } from "@/components/ui/icon";
import {
  airportShuttleIcon,
  arrowForwardIcon,
  boltIcon,
  businessCenterIcon,
  chairIcon,
  constructionIcon,
  deliveryTruckSpeedIcon,
  directionsBoatIcon,
  directionsCarIcon,
  frontLoaderIcon,
  groupsIcon,
  houseIcon,
  militaryTechIcon,
  palletIcon,
  routeIcon,
  rvHookupIcon,
  sailingIcon,
  schoolIcon,
  storefrontIcon,
  carRentalIcon,
  twoWheelerIcon,
  agricultureIcon,
  weightIcon,
  listAltIcon,
  handshakeIcon,
  travelExploreIcon,
  paymentsIcon,
  verifiedUserIcon,
  supportAgentIcon,
  sellIcon,
  calculateIcon,
  straightenIcon,
  scaleIcon,
  scheduleIcon,
  infoIcon,
  smartToyIcon,
  articleIcon,
  callIcon,
  helpIcon,
  factCheckIcon,
  type IconData,
} from "@/components/ui/icons.generated";
import { megaNav, type MegaGroup, type MegaSection, type NavIcon } from "@/content/site";

const navIconData: Record<NavIcon, IconData> = {
  house: houseIcon,
  route: routeIcon,
  chair: chairIcon,
  office: businessCenterIcon,
  school: schoolIcon,
  military: militaryTechIcon,
  store: storefrontIcon,
  groups: groupsIcon,
  weight: weightIcon,
  car: directionsCarIcon,
  moto: twoWheelerIcon,
  boat: directionsBoatIcon,
  sail: sailingIcon,
  rv: rvHookupIcon,
  atv: agricultureIcon,
  truck: airportShuttleIcon,
  parts: constructionIcon,
  pallet: palletIcon,
  heavy: frontLoaderIcon,
  rental: carRentalIcon,
  driver: deliveryTruckSpeedIcon,
  bolt: boltIcon,
  steps: listAltIcon,
  partners: handshakeIcon,
  board: travelExploreIcon,
  payments: paymentsIcon,
  shield: verifiedUserIcon,
  dispatch: supportAgentIcon,
  leads: sellIcon,
  calc: calculateIcon,
  volume: straightenIcon,
  scale: scaleIcon,
  schedule: scheduleIcon,
  info: infoIcon,
  ai: smartToyIcon,
  article: articleIcon,
  contact: callIcon,
  help: helpIcon,
  compare: factCheckIcon,
  quote: boltIcon,
};

function Group({ group, columns }: { group: MegaGroup; columns: 1 | 2 }) {
  return (
    <div className="min-w-0">
      <p className="px-3 pb-2 text-label-md font-medium tracking-[0.08em] text-on-surface-variant uppercase">
        {group.href ? (
          <a href={group.href} className="rounded-xs hover:text-primary">
            {group.label}
          </a>
        ) : (
          group.label
        )}
      </p>
      <ul className={columns === 1 ? "flex flex-col" : "grid grid-cols-2 gap-x-2"}>
        {group.links.map((link) => (
          <li key={link.href}>
            <a
              href={link.href}
              className={`state-layer group/l relative block rounded-md py-2 pr-3 text-title-sm text-on-surface outline-offset-[-2px] hover:text-primary focus-visible:text-primary ${link.icon ? "pl-11" : "pl-3"}`}
            >
              {link.icon && (
                <Icon
                  icon={navIconData[link.icon]}
                  size={20}
                  className="absolute top-2.5 left-3 text-on-surface-variant transition-colors duration-(--duration-short4) ease-standard group-hover/l:text-primary group-focus-visible/l:text-primary"
                />
              )}
              {link.label}
              {link.description && <span className="block text-body-sm text-on-surface-variant">{link.description}</span>}
            </a>
          </li>
        ))}
      </ul>
      {group.more && (
        <a href={group.more.href} className="state-layer mt-1 inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-label-lg font-medium text-primary">
          {group.more.label}
          <Icon icon={arrowForwardIcon} size={16} />
        </a>
      )}
    </div>
  );
}

function Features({ section }: { section: MegaSection }) {
  if (!section.features?.length) return null;
  return (
    <ul className="flex flex-col gap-1">
      {section.features.map((f, i) => (
        <li key={f.href}>
          <a
            href={f.href}
            className={
              i === 0
                ? "state-layer flex flex-col gap-1 rounded-md bg-primary px-4 py-3.5 text-on-primary outline-offset-2"
                : "state-layer flex flex-col gap-1 rounded-md px-4 py-3 text-on-surface outline-offset-[-2px]"
            }
          >
            <span className="flex items-center gap-2 text-title-sm">
              {f.icon && <Icon icon={navIconData[f.icon]} size={20} />}
              {f.label}
              <Icon icon={arrowForwardIcon} size={16} className="ml-auto" />
            </span>
            <span className={i === 0 ? "text-body-sm text-on-primary/85" : "text-body-sm text-on-surface-variant"}>{f.description}</span>
          </a>
        </li>
      ))}
    </ul>
  );
}

function Guides({ group }: { group: MegaGroup }) {
  return (
    <div className="border-t border-outline-variant pt-4">
      <p className="px-4 pb-1.5 text-label-md font-medium tracking-[0.08em] text-on-surface-variant uppercase">{group.label}</p>
      <ul className="grid grid-cols-2">
        {group.links.map((link) => (
          <li key={link.href}>
            <a href={link.href} className="state-layer block rounded-sm px-4 py-1.5 text-body-md text-on-surface-variant outline-offset-[-2px] hover:text-primary">
              {link.label}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}

function Panel({ section }: { section: MegaSection }) {
  if (section.id === "ship") {
    return (
      <div className="mx-auto grid max-w-[1440px] grid-cols-[repeat(3,minmax(0,1fr))_minmax(280px,320px)] gap-6 px-8 pt-6 pb-7">
        {section.groups.map((g) => (
          <Group key={g.label} group={g} columns={1} />
        ))}
        <div className="flex flex-col gap-4 border-l border-outline-variant pl-6">
          <Features section={section} />
          {section.guides && <Guides group={section.guides} />}
        </div>
      </div>
    );
  }
  const two = section.groups.some((g) => g.links.length > 5);
  return (
    <div className={`flex max-w-full flex-col gap-3 p-3 pt-4 ${two ? "w-[600px]" : "w-[380px]"}`}>
      {section.groups.map((g) => (
        <Group key={g.label} group={g} columns={two ? 2 : 1} />
      ))}
      {section.features?.length ? (
        <div className="border-t border-outline-variant pt-3">
          <Features section={section} />
        </div>
      ) : null}
    </div>
  );
}

export function MegaPanel({ id }: { id: string }) {
  const section = megaNav.find((s) => s.id === id);
  return section ? <Panel section={section} /> : null;
}
