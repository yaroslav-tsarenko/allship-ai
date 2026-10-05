"use client";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog } from "@/components/ui/dialog";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  analytics: boolean;
  ads: boolean;
  onAnalyticsChange: (v: boolean) => void;
  onAdsChange: (v: boolean) => void;
  onSave: () => void;
};

export function ConsentDialog({ open, onOpenChange, analytics, ads, onAnalyticsChange, onAdsChange, onSave }: Props) {
  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title="Cookie settings"
      description="Essential cookies are always on. Choose which optional cookies we may use."
      actions={
        <>
          <Button variant="text" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={onSave}>Save choices</Button>
        </>
      }
    >
      <Checkbox checked disabled label="Essential: sign-in, security and your cookie choice" />
      <Checkbox checked={analytics} onCheckedChange={(v) => onAnalyticsChange(v === true)} label="Analytics: Google Analytics and Microsoft Clarity, to see how pages are used" />
      <Checkbox checked={ads} onCheckedChange={(v) => onAdsChange(v === true)} label="Advertising: Google Ads measurement and remarketing" />
      <p className="text-body-sm text-on-surface-variant">If your browser sends a Global Privacy Control signal, advertising cookies stay off.</p>
    </Dialog>
  );
}
