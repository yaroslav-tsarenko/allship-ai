import Link from "next/link";
import { Icon } from "@/components/ui/icon";
import { calculateIcon, northEastIcon, sellIcon, straightenIcon, scaleIcon, type IconData } from "@/components/ui/icons.generated";

export type ToolKey = "moving-cost" | "car-shipping" | "cubic-feet" | "freight-class" | "pricing";

export const tools: Record<ToolKey, { label: string; href: string; description: string; icon: IconData }> = {
  "moving-cost": {
    label: "Moving cost calculator",
    href: "/tools/moving-cost-calculator",
    description: "Turn home size and distance into a typical price range before you post.",
    icon: calculateIcon,
  },
  "car-shipping": {
    label: "Car shipping cost calculator",
    href: "/tools/car-shipping-cost-calculator",
    description: "Compare open and enclosed transport for your route and vehicle type.",
    icon: calculateIcon,
  },
  "cubic-feet": {
    label: "Cubic feet calculator",
    href: "/tools/cubic-feet-calculator",
    description: "Count furniture room by room to get the volume carriers price on.",
    icon: straightenIcon,
  },
  "freight-class": {
    label: "Freight class calculator",
    href: "/tools/freight-class-calculator",
    description: "Enter dimensions and weight to get density and an estimated class.",
    icon: scaleIcon,
  },
  pricing: {
    label: "Pricing and fees",
    href: "/pricing",
    description: "What you pay: the carrier's bid plus the AllShip service fee, held in escrow.",
    icon: sellIcon,
  },
};

export function NextSteps({ keys, title = "Plan it before you post" }: { keys: ToolKey[]; title?: string }) {
  return (
    <nav aria-label={title}>
      <h3 className="text-title-md text-on-surface-variant">{title}</h3>
      <ul className="mt-3 flex flex-col">
        {keys.map((key) => {
          const tool = tools[key];
          return (
            <li key={key} className="border-b border-outline-variant last:border-b-0">
              <Link href={tool.href} className="group flex items-start gap-3 py-4">
                <Icon icon={tool.icon} size={22} className="mt-0.5 shrink-0 text-primary" />
                <span className="min-w-0 flex-1">
                  <span className="block text-title-md text-on-surface group-hover:text-primary group-hover:underline">{tool.label}</span>
                  <span className="mt-0.5 block text-body-md text-pretty text-on-surface-variant">{tool.description}</span>
                </span>
                <Icon icon={northEastIcon} size={18} className="mt-1 shrink-0 text-on-surface-variant" />
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
