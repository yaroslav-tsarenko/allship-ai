import { PublicLoadPage } from "@/features/public-load/form-page";
import { formConfigs } from "@/features/public-load/model";
import { buildMetadata } from "@/lib/seo";

const description = "Rent a truck with a driver by the day. Post what you need, compare bids from verified carriers and pay into escrow only when you book.";

export const metadata = buildMetadata({ title: "Rent a Truck", description, path: formConfigs.rent.path });

export default function Page() {
  return <PublicLoadPage kind="rent" seo={{ name: "Truck rental with driver", description, serviceType: "Truck rental", crumb: "Rent a truck" }} />;
}
