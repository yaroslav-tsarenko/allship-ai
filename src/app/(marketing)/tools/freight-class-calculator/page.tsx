import { FreightClassCalculator } from "@/components/marketing/tools/freight-class-calculator";
import { FormulaBlock, ToolPage } from "@/components/marketing/tools/tool-page";
import { buildMetadata } from "@/lib/seo";

const path = "/tools/freight-class-calculator";
const description = "Calculate freight density in pounds per cubic foot and the matching NMFC freight class from the 13-tier density scale. Enter dimensions, weight and pieces.";

export const metadata = buildMetadata({ title: "Freight Class Calculator: Density to NMFC Class", description, path });

export default function Page() {
  return (
    <ToolPage
      path={path}
      crumb="Freight class calculator"
      title="Freight class calculator"
      intro="Enter the size and weight of your pallets or crates to get their density and the density-based NMFC freight class carriers use for LTL pricing."
      appName="AllShip AI freight class calculator"
      appDescription={description}
      calculator={<FreightClassCalculator />}
      method={
        <>
          <p>Freight class is set by the National Motor Freight Classification (NMFC), published by the National Motor Freight Traffic Association. Lower classes are denser and cheaper to ship per pound. Many commodities are classed by density alone, using the 13-tier scale in the table above, which took effect on July 19, 2025.</p>
          <FormulaBlock label="Formula">
            {`volume (ft³)   = length × width × height (in) ÷ 1,728 × pieces
weight (lb)    = weight per piece × pieces
density        = weight ÷ volume
freight class  = density bracket on the 13-tier scale`}
          </FormulaBlock>
          <h3>When the result can differ</h3>
          <p>Some items keep a specific class in their NMFC listing regardless of density, and handling, stowability or liability characteristics can move a class up. Hazardous materials have their own rules. Check your commodity&apos;s listing, or ask the carrier, before you put a class on the bill of lading.</p>
          <h3>Measure carefully</h3>
          <p>Carriers re-measure and re-weigh freight, often with dimensioning scanners. A pallet that is 2 inches taller than declared can fall into a lower density bracket and get reclassed at a higher price.</p>
        </>
      }
      related={[
        { label: "Get freight bids", href: "/quote?category=freight", description: "LTL and full truckload carriers bid on your load." },
        { label: "Freight shipping", href: "/services/freight", description: "Pallets, crates and truckload freight." },
        { label: "Heavy equipment", href: "/services/heavy-equipment", description: "Machinery and oversize loads." },
        { label: "Pricing and fees", href: "/pricing", description: "Carrier price plus a 10% service fee." },
      ]}
      faq={[
        {
          question: "What is freight density?",
          answer: "Density is the weight of a shipment divided by the space it takes up, in pounds per cubic foot. A 48 × 40 × 48 inch pallet weighing 500 pounds takes up 53.3 cubic feet, so its density is about 9.4 lb/ft³, which is class 100.",
        },
        {
          question: "Is the density class always my final freight class?",
          answer: "No. It is correct for commodities classed by density, but some NMFC items have a fixed class, and handling or liability factors can change it. The commodity's NMFC listing decides.",
        },
        {
          question: "What changed in the NMFC in 2025?",
          answer: "The density scale grew from 11 to 13 tiers, effective July 19, 2025, and many commodities that had their own class were moved to density-based classes. Older charts online may still show the 11-tier scale.",
        },
        {
          question: "Does freight class matter for full truckload?",
          answer: "Usually not. Full truckload is priced by the trip. Freight class mainly drives LTL pricing, where your freight shares a trailer with other shipments.",
        },
      ]}
    />
  );
}
