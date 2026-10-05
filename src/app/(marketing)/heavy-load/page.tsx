import { PublicLoadPage } from "@/features/public-load/form-page";
import { formConfigs } from "@/features/public-load/model";
import { buildMetadata } from "@/lib/seo";

const description = "Post heavy and oversized equipment for transport. Verified carriers with the right trailers bid, and your payment waits in escrow until delivery.";

export const metadata = buildMetadata({ title: "Heavy and Oversized Loads", description, path: formConfigs.heavy.path });

export default function Page() {
  return <PublicLoadPage kind="heavy" seo={{ name: "Heavy equipment transport", description, serviceType: "Heavy equipment hauling", crumb: "Heavy load" }} />;
}
