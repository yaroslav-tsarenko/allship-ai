import { carAssumptions, vehicleSizes } from "@/components/marketing/tools/car-shipping-math";
import { CarShippingCalculator } from "@/components/marketing/tools/car-shipping-calculator";
import { num, usd } from "@/components/marketing/tools/rate-curve";
import { AssumptionTable, FormulaBlock, ToolPage } from "@/components/marketing/tools/tool-page";
import { buildMetadata } from "@/lib/seo";

const path = "/tools/car-shipping-cost-calculator";
const description = "Estimate what it costs to ship a car by distance, vehicle size, open or enclosed trailer and condition. Every assumption and the 10% fee are shown.";

export const metadata = buildMetadata({ title: "Car Shipping Cost Calculator: Open vs Enclosed", description, path });

const a = carAssumptions;

export default function Page() {
  return (
    <ToolPage
      path={path}
      crumb="Car shipping cost calculator"
      title="Car shipping cost calculator"
      intro="Enter the distance and a few details about the vehicle to see a rough price range for auto transport, including the AllShip service fee."
      appName="AllShip AI car shipping cost calculator"
      appDescription={description}
      calculator={<CarShippingCalculator />}
      method={
        <>
          <p>Car transport is usually priced per trip, and the price per mile drops as the trip gets longer because loading and unloading cost the same on every trip. The calculator starts from a base range for a running sedan on an open trailer, then adjusts it for your vehicle. These are working assumptions, not market data. Carriers set the real price in their bids.</p>
          <FormulaBlock label="Formula">
            {`carrier price = base range for distance × size factor
                × enclosed factor              (if enclosed)
                + inoperable surcharge         (if it doesn't run)
total         = carrier price + 10% AllShip service fee`}
          </FormulaBlock>
          <h3>Base range by distance</h3>
          <p>Read from this table and drawn as a straight line between rows.</p>
          <AssumptionTable caption="Running sedan, open trailer" head={["Distance", "Low", "High"]} rows={a.baseByDistance.map((p) => [`${num.format(p.miles)} mi`, usd.format(p.low), usd.format(p.high)])} />
          <h3>Adjustments</h3>
          <AssumptionTable
            caption="Adjustment assumptions"
            head={["Adjustment", "Low", "High"]}
            rows={[
              ...vehicleSizes.map((v) => [`Size: ${v.label}`, `× ${v.multiplier}`, `× ${v.multiplier}`]),
              ["Enclosed trailer", `× ${a.enclosedMultiplier.low}`, `× ${a.enclosedMultiplier.high}`],
              ["Doesn't run", `+ ${usd.format(a.inoperableSurcharge.low)}`, `+ ${usd.format(a.inoperableSurcharge.high)}`],
            ]}
          />
          <p>Totals are rounded to the nearest $10.</p>
          <h3>What it leaves out</h3>
          <p>Rural pickup points, tight pickup windows, seasonal demand such as snowbird routes, and modifications like lift kits all change the price. Add them to your load so carriers can account for them.</p>
        </>
      }
      related={[
        { label: "Get bids to ship your car", href: "/quote?category=car-or-light-truck", description: "FMCSA-verified carriers bid on your route." },
        { label: "Car shipping", href: "/services/car-or-light-truck", description: "Open and enclosed auto transport." },
        { label: "Vehicle transport", href: "/vehicle-load", description: "Motorcycles, boats, RVs and more." },
        { label: "Pricing and fees", href: "/pricing", description: "How the 10% service fee works." },
      ]}
      faq={[
        {
          question: "Is open or enclosed car shipping better?",
          answer: "Open trailers suit most everyday cars and cost less. Enclosed trailers protect the car from weather and road debris, which matters for classic, exotic or newly painted cars. In this calculator enclosed adds 40% to 70%.",
        },
        {
          question: "Why does a car that doesn't run cost more to ship?",
          answer: "The carrier has to winch or lift it onto the trailer, which needs equipment and extra time at pickup and delivery. Tell carriers up front so the bid covers it.",
        },
        {
          question: "When do I pay for car shipping on AllShip?",
          answer: "You pay when you accept a bid. The money is held in escrow through Stripe and released to the carrier after delivery is confirmed, or automatically 72 hours after delivery if you don't raise an issue.",
        },
        {
          question: "Does this estimate include insurance?",
          answer: "Carriers on AllShip must carry cargo insurance, and its cost is part of their price. Ask the carrier for their coverage limit before you accept a bid on a high-value vehicle.",
        },
      ]}
    />
  );
}
