import { CubicFeetCalculator } from "@/components/marketing/tools/cubic-feet-calculator";
import { cubicFeetAssumptions, trucks } from "@/components/marketing/tools/cubic-feet-math";
import { num } from "@/components/marketing/tools/rate-curve";
import { AssumptionTable, FormulaBlock, ToolPage } from "@/components/marketing/tools/tool-page";
import { buildMetadata } from "@/lib/seo";

const path = "/tools/cubic-feet-calculator";
const description = "Count furniture and boxes room by room to get your move's total cubic feet, an estimated weight and the moving truck size that fits it, from 10 to 26 ft.";

export const metadata = buildMetadata({ title: "Moving Cubic Feet Calculator and Truck Size", description, path });

export default function Page() {
  return (
    <ToolPage
      path={path}
      crumb="Cubic feet calculator"
      title="Cubic feet calculator"
      intro="Go room by room and add what you're moving. You'll get the total volume, a weight estimate and the truck size that fits."
      appName="AllShip AI cubic feet calculator"
      appDescription={description}
      calculator={<CubicFeetCalculator />}
      method={
        <>
          <p>Movers estimate volume with a cube sheet: a list of common household items, each with a typical size in cubic feet. This calculator works the same way. Item sizes are typical values from published cube sheets, and real furniture varies, so measure anything unusually large.</p>
          <FormulaBlock label="Formula">
            {`total volume  = Σ (item volume × quantity)
weight        ≈ total volume × ${cubicFeetAssumptions.poundsPerCubicFoot} lb/ft³
truck         = smallest truck where total ≤ capacity × ${cubicFeetAssumptions.usableShare * 100}%`}
          </FormulaBlock>
          <h3>Truck sizes</h3>
          <p>Capacities are rounded from the cargo space rental companies publish for each size. We plan on filling {cubicFeetAssumptions.usableShare * 100}% of it, because furniture never packs perfectly and the space over the cab is hard to use.</p>
          <AssumptionTable caption="Typical cargo space" head={["Truck", "Cargo space", "Plan to load up to"]} rows={trucks.map((t) => [t.size, `${num.format(t.cubicFeet)} ft³`, `${num.format(Math.floor(t.cubicFeet * cubicFeetAssumptions.usableShare))} ft³`])} />
          <h3>Weight</h3>
          <p>Seven pounds per cubic foot is a common rule of thumb for packed household goods. Books, tools and appliances weigh more, bedding and lamps less. Interstate movers weigh the truck for the final bill.</p>
        </>
      }
      related={[
        { label: "Estimate your moving cost", href: "/tools/moving-cost-calculator", description: "Turn the volume into a price range." },
        { label: "Get bids for your move", href: "/quote?category=long-distance-moving", description: "Post once, compare carrier bids." },
        { label: "Rent a truck", href: "/services/truck-rental", description: "A box truck and driver booked for the day." },
        { label: "Household items", href: "/services/household-items", description: "Ship a few pieces, not a whole home." },
      ]}
      faq={[
        {
          question: "How many cubic feet is a 2-bedroom apartment?",
          answer: "Around 600 cubic feet is a common planning figure, but a furnished 2-bedroom can run well past that. Counting room by room here gives you a number based on what you own.",
        },
        {
          question: "What size truck do I need for a 3-bedroom house?",
          answer: "A typical 3-bedroom home is close to 950 cubic feet, which usually means a 26 ft truck. Add your items to check, since garages and storage rooms add up fast.",
        },
        {
          question: "How do I measure an item that isn't on the list?",
          answer: "Measure length, width and height in inches, multiply them, and divide by 1,728 to get cubic feet. Pick the closest listed item with a similar volume and add it.",
        },
      ]}
    />
  );
}
