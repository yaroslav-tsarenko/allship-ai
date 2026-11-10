"use client";

import { Button } from "@/components/ui/button";

export function PrintButton() {
  return (
    <Button variant="tonal" onClick={() => window.print()}>
      Download PDF
    </Button>
  );
}
