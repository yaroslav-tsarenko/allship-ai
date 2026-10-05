import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Container } from "@/components/marketing/section";
import { FeatureSpotlight, Theater, TheaterTabs } from "@/components/theater";
import {
  CarCarrier,
  Dolly,
  EscrowShield,
  MapGrid,
  Pallet,
  RoutePin,
  Truck,
  VerifiedBadge,
} from "@/components/theater/illustrations";
import { scenes, sceneIds } from "@/components/theater/scenes";

export const metadata: Metadata = { title: "Product Theater", robots: { index: false, follow: false } };

const illustrations = [
  ["Truck", Truck],
  ["Pallet", Pallet],
  ["CarCarrier", CarCarrier],
  ["Dolly", Dolly],
  ["RoutePin", RoutePin],
  ["EscrowShield", EscrowShield],
  ["VerifiedBadge", VerifiedBadge],
  ["MapGrid", MapGrid],
] as const;

function Label({ children }: { children: string }) {
  return (
    <p className="bg-tertiary-container text-body-sm text-on-tertiary-container inline-flex rounded-xs px-2 py-1 font-mono">
      {children}
    </p>
  );
}

export default function TheaterGallery() {
  if (process.env.NODE_ENV === "production") notFound();
  return (
    <Container className="py-12">
      <h1 className="text-display-sm text-on-surface">Product Theater</h1>
      <p className="text-body-xl text-on-surface-variant mt-3 max-w-[70ch]">
        Scripted demos of the real product UI. Use the theme toggle in the header to check dark mode. Rows
        below play side by side; on real pages only the most visible theater plays.
      </p>

      <section className="mt-14 flex flex-col gap-4">
        <Label>{"<TheaterTabs tabs={[postLoad, bidsCompare, liveTracking, escrowFlow]} />"}</Label>
        <TheaterTabs
          tabs={[
            { scene: "postLoad", label: "Post" },
            { scene: "bidsCompare", label: "Compare" },
            { scene: "liveTracking", label: "Track" },
            { scene: "escrowFlow", label: "Pay" },
          ]}
        />
      </section>

      <section className="mt-20 flex flex-col gap-6">
        <Label>{'<FeatureSpotlight scene="aiAssistant" />'}</Label>
        <FeatureSpotlight
          scene="aiAssistant"
          eyebrow="AllShip AI"
          title="Ask about your loads in plain words"
          description="The assistant reads your loads and bids, explains the trade-offs and opens the right page. It never accepts, pays or posts anything for you."
        />
      </section>

      <section className="mt-20 flex flex-col gap-6">
        <Label>{'<FeatureSpotlight scene="carrierBoard" reverse />'}</Label>
        <FeatureSpotlight
          scene="carrierBoard"
          reverse
          eyebrow="For carriers"
          title="Find loads on your lanes and bid in a minute"
          description="Filter by category and pickup state, open a load and see exactly what you receive before you bid."
        />
      </section>

      {sceneIds.map((id) => (
        <section key={id} id={id} className="border-outline-variant mt-20 flex flex-col gap-4 border-t pt-10">
          <div className="flex flex-wrap items-baseline gap-3">
            <Label>{`<Theater scene="${id}" />`}</Label>
            <h2 className="text-headline-sm text-on-surface">{scenes[id].title}</h2>
          </div>
          <p className="text-body-lg text-on-surface-variant max-w-[70ch]">{scenes[id].summary}</p>
          {id === "adaptive" ? (
            <Theater scene={id} steps exclusive={false} />
          ) : (
            <div className="expanded:grid-cols-[minmax(0,2.2fr)_minmax(0,1fr)] grid items-start gap-10">
              <Theater scene={id} device="desktop" steps exclusive={false} />
              <Theater scene={id} device="phone" exclusive={false} />
            </div>
          )}
        </section>
      ))}

      <section className="border-outline-variant mt-20 border-t pt-10">
        <Label>illustrations</Label>
        <ul className="medium:grid-cols-4 mt-6 grid grid-cols-2 gap-6">
          {illustrations.map(([name, Art]) => (
            <li key={name} className="bg-surface-container-low flex flex-col gap-3 rounded-md p-4">
              <Art />
              <span className="text-body-sm text-on-surface-variant font-mono">{name}</span>
            </li>
          ))}
        </ul>
      </section>
    </Container>
  );
}
