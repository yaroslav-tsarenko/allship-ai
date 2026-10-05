import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { CarrierOnboardingForm, ShipperOnboardingForm } from "@/features/onboarding/onboarding-form";
import { getViewer } from "@/server/viewer/viewer";

export const metadata: Metadata = { title: "Set up your account" };

export default async function OnboardingPage() {
  const viewer = await getViewer();
  if (!viewer.needsOnboarding) redirect("/app");
  const [first = "", ...rest] = viewer.user.name.split(" ");
  const defaults = {
    firstName: viewer.user.firstName ?? first,
    lastName: viewer.user.lastName ?? rest.join(" "),
    phone: viewer.user.phone ?? "",
  };
  const carrier = viewer.user.accountType === "carrier";
  return (
    <div className="mx-auto max-w-[720px]">
      <PageHeader
        title={carrier ? "Add your company" : "Finish your profile"}
        description={carrier ? "Carriers bid as a company. Your drivers join later by invitation." : "Carriers see your name on loads you post."}
      />
      <Card className="p-6 medium:p-8">
        {carrier ? <CarrierOnboardingForm defaults={defaults} /> : <ShipperOnboardingForm defaults={defaults} />}
      </Card>
    </div>
  );
}
