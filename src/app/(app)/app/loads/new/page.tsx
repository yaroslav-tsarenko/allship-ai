import type { Metadata } from "next";
import Link from "next/link";
import { Icon } from "@/components/ui/icon";
import { arrowBackIcon } from "@/components/ui/icons.generated";
import { requireShipper } from "@/features/loads/guard";
import { LoadWizard } from "@/features/loads/load-wizard";

export const metadata: Metadata = { title: "Post a load" };

export default async function NewLoadPage() {
  await requireShipper();
  return (
    <div className="mx-auto max-w-[960px]">
      <div className="flex items-center gap-2 pt-2 pb-6 medium:pt-4">
        <Link href="/app/loads" aria-label="Back to loads" className="state-layer -ml-2 inline-flex size-10 items-center justify-center rounded-full text-on-surface-variant">
          <Icon icon={arrowBackIcon} />
        </Link>
        <h1 className="text-headline-md text-on-surface medium:text-headline-lg">Post a load</h1>
      </div>
      <LoadWizard />
    </div>
  );
}
