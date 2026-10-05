import { Icon } from "@/components/ui/icon";
import { keyboardArrowDownIcon } from "@/components/ui/icons.generated";
import { headerLinks, megaNav } from "@/content/site";
import { MegaNav } from "./mega-nav";

const trigger =
  "state-layer inline-flex h-10 cursor-pointer items-center gap-0.5 rounded-full pr-2 pl-3.5 text-label-lg font-medium text-on-surface-variant transition-colors duration-(--duration-short4) ease-standard hover:text-on-surface data-[state=open]:bg-secondary-container data-[state=open]:text-on-secondary-container [&>svg]:transition-transform [&>svg]:duration-(--duration-medium2) data-[state=open]:[&>svg]:rotate-180";
const plain =
  "state-layer inline-flex h-10 items-center rounded-full px-3.5 text-label-lg font-medium text-on-surface-variant transition-colors duration-(--duration-short4) ease-standard hover:text-on-surface data-[active]:bg-secondary-container data-[active]:text-on-secondary-container";

export function DesktopNav() {
  return (
    <MegaNav
      items={megaNav.map((s) => ({ id: s.id, label: s.label, wide: s.id === "ship" }))}
      links={headerLinks}
      chevron={<Icon icon={keyboardArrowDownIcon} size={20} />}
      triggerClassName={trigger}
      linkClassName={plain}
    />
  );
}
