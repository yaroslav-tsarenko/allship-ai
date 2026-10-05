import { Container } from "@/components/marketing/section";
import { RouteEstimate, SectionHeader } from "@/components/sections";
import { routes } from "./content";

export function PopularRoutes() {
  return (
    <section aria-labelledby="routes-title" className="py-16 medium:py-24">
      <Container>
        <SectionHeader
          id="routes-title"
          title="Popular routes"
          description="Carriers price each job by bid, so there is no fixed rate per mile. Start from a route and get real prices for your dates."
          className="mb-10"
        />
        <ul className="grid gap-4 medium:grid-cols-2 large:grid-cols-4">
          {routes.map((r) => (
            <li key={`${r.origin}-${r.destination}`} className="grid">
              <RouteEstimate
                origin={r.origin}
                destination={r.destination}
                distance={r.distance}
                priceLabel="Set by carrier bids"
                cta={{
                  label: "Rent Truck",
                  href: `/quote?${new URLSearchParams({ category: "truck-with-driver", from: r.origin, to: r.destination, src: "truck_with_driver_route" }).toString()}`,
                }}
              />
            </li>
          ))}
        </ul>
      </Container>
    </section>
  );
}
