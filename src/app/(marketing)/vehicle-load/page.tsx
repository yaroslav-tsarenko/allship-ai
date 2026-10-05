import { PublicLoadPage } from "@/features/public-load/form-page";
import { formConfigs } from "@/features/public-load/model";
import { buildMetadata } from "@/lib/seo";

const description = "Ship a car, motorcycle, boat, RV, trailer or parts. Post your vehicle load for free, compare bids from verified carriers and pay into escrow only when you book.";

export const metadata = buildMetadata({ title: "Vehicle Transport: Post a Vehicle Load", description, path: formConfigs.vehicle.path });

export default function Page() {
  return <PublicLoadPage kind="vehicle" seo={{ name: "Vehicle transport", description, serviceType: "Vehicle shipping", crumb: "Vehicle load" }} />;
}
