import { MovingCostCalculator } from "@/components/marketing/tools/moving-cost-calculator";
import { homeSizes, movingAssumptions } from "@/components/marketing/tools/moving-cost-math";
import { num } from "@/components/marketing/tools/rate-curve";
import { AssumptionTable, FormulaBlock, ToolPage } from "@/components/marketing/tools/tool-page";
import { buildMetadata } from "@/lib/seo";

const path = "/tools/moving-cost-calculator";
const description = "Estimate a moving cost range from home size, distance, packing, storage and unpacking. See the volume, every assumption and the 10% fee before you post.";

export const metadata = buildMetadata({ title: "Moving Cost Calculator: Estimate by Home Size", description, path });

const a = movingAssumptions;
const money = (v: number) => `$${v.toFixed(2)}`;

export default function Page() {
  return (
    <ToolPage
      path={path}
      crumb="Moving cost calculator"
      title="Moving cost calculator"
      intro="Pick your home size and distance to get a rough price range. Add packing, storage or unpacking to see how each one moves the total."
      appName="AllShip AI moving cost calculator"
      appDescription={description}
      calculator={<MovingCostCalculator />}
      method={
        <>
          <p>The calculator turns your home size into a volume in cubic feet, prices that volume by distance, then adds the services you picked. Every number below is a working assumption, not a quote and not market data. Carriers on AllShip set their own prices when they bid.</p>
          <FormulaBlock label="Formula">
            {`carrier price = max(volume × distance rate, minimum)
              + volume × packing share × packing rate
              + volume × unpacking rate        (if selected)
              + volume × months × storage rate
total         = carrier price + 10% AllShip service fee`}
          </FormulaBlock>
          <h3>Volume by home size</h3>
          <p>These volumes come from the moving quote form on our earlier site. Furniture-heavy homes run higher, minimalist homes lower.</p>
          <AssumptionTable caption="Typical volume" head={["Home size", "Volume"]} rows={homeSizes.map((h) => [h.label, `${num.format(h.cubicFeet)} ft³`])} />
          <h3>Distance rate per cubic foot</h3>
          <p>The rate is read from this table and drawn as a straight line between rows, so 125 miles sits between the 50-mile and 250-mile rates.</p>
          <AssumptionTable caption="Transport rate assumption" head={["Distance", "Low", "High"]} rows={a.transportPerCubicFoot.map((p) => [`${num.format(p.miles)} mi`, money(p.low), money(p.high)])} />
          <h3>Services</h3>
          <AssumptionTable
            caption="Service rate assumptions"
            head={["Item", "Low", "High"]}
            rows={[
              ["Minimum transport charge", `$${a.minimumTransport.low}`, `$${a.minimumTransport.high}`],
              ["Packing, per ft³ packed", money(a.packingPerCubicFoot.low), money(a.packingPerCubicFoot.high)],
              ["Unpacking, per ft³", money(a.unpackingPerCubicFoot.low), money(a.unpackingPerCubicFoot.high)],
              ["Storage, per ft³ per month", money(a.storagePerCubicFootMonth.low), money(a.storagePerCubicFootMonth.high)],
            ]}
          />
          <p>Packing share is 25% for fragile items only, 50% for partial packing and 100% for full packing. Totals are rounded to the nearest $10.</p>
          <h3>What it leaves out</h3>
          <p>Stairs, long carries, elevators, bulky items like pianos or safes, peak-season dates and valuation coverage all change real prices. Put them in your load details so carriers can include them in their bids.</p>
        </>
      }
      related={[
        { label: "Get bids for your move", href: "/quote?category=long-distance-moving", description: "Post once. Verified carriers send prices." },
        { label: "Count your cubic feet", href: "/tools/cubic-feet-calculator", description: "Room-by-room inventory and truck size." },
        { label: "Pricing and fees", href: "/pricing", description: "What the 10% service fee covers." },
        { label: "Long-distance moving", href: "/services/long-distance-moving", description: "How interstate moves work on AllShip." },
        { label: "Local moving", href: "/services/local-moving", description: "Moves under 50 miles." },
      ]}
      faq={[
        {
          question: "How accurate is this moving cost estimate?",
          answer: "It is a rough range built from the assumptions shown on this page, so treat it as a budget starting point. The price you pay is the bid you accept from a carrier, plus the 10% AllShip service fee shown before you pay.",
        },
        {
          question: "Why does the calculator use cubic feet instead of weight?",
          answer: "Volume is easier to estimate from home size or a room-by-room count, and it decides which truck you need. Interstate movers often bill by weight, which roughly tracks volume. Many movers plan around 7 pounds per cubic foot.",
        },
        {
          question: "Does the range include the AllShip service fee?",
          answer: "Yes. The breakdown shows the carrier price and the 10% service fee separately, and the estimated total includes both.",
        },
        {
          question: "What if my home has more furniture than average?",
          answer: "Choose \"I know my cubic feet\" and enter your own volume. The cubic feet calculator adds up common furniture and boxes room by room and links back here with the total filled in.",
        },
      ]}
    />
  );
}
