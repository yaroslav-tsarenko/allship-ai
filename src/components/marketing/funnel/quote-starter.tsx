import { QuickQuote } from "@/components/pages/home/quick-quote";
import { Icon } from "@/components/ui/icon";
import { arrowForwardIcon, swapHorizIcon } from "@/components/ui/icons.generated";
import { cn } from "@/lib/cn";

export function QuoteStarter({
  align = "start",
  className,
}: {
  align?: "start" | "center";
  className?: string;
}) {
  return (
    <div
      className={cn(
        align === "start" && "[&_fieldset]:justify-start [&_form]:mx-0 [&_form>p]:text-left",
        className,
      )}
    >
      <QuickQuote
        arrowIcon={<Icon icon={arrowForwardIcon} size={20} />}
        swapIcon={<Icon icon={swapHorizIcon} size={22} />}
      />
    </div>
  );
}
