import { PublicLoadPage } from "@/features/public-load/form-page";
import { formConfigs } from "@/features/public-load/model";
import { buildMetadata } from "@/lib/seo";

const description = "Post and book freight loads with verified carriers. Pallets, crates and full truckloads, with bids you can compare and payment held in escrow.";

export const metadata = buildMetadata({ title: "Freight Loads", description, path: formConfigs.freight.path });

export default function Page() {
  return <PublicLoadPage kind="freight" seo={{ name: "Freight shipping", description, serviceType: "Freight transport", crumb: "Freight load" }} />;
}
