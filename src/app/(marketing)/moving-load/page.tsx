import { PublicLoadPage } from "@/features/public-load/form-page";
import { formConfigs } from "@/features/public-load/model";
import { buildMetadata } from "@/lib/seo";

const description = "Post your moving job and receive offers from verified movers. Easy scheduling, and your payment stays in escrow until the move is done.";

export const metadata = buildMetadata({ title: "Post a Moving Load", description, path: formConfigs.moving.path });

export default function Page() {
  return <PublicLoadPage kind="moving" seo={{ name: "Moving load posting", description, serviceType: "Moving services", crumb: "Moving load" }} />;
}
