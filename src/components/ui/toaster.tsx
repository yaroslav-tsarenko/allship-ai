"use client";

import { Toaster as Sonner } from "sonner";

export function Toaster() {
  return (
    <Sonner
      position="bottom-center"
      toastOptions={{
        unstyled: true,
        classNames: {
          toast:
            "flex w-full max-w-[560px] items-center gap-3 rounded-xs bg-inverse-surface px-4 py-3.5 text-body-md text-inverse-on-surface shadow-elevation-3",
          title: "font-normal",
          description: "text-inverse-on-surface/80",
          actionButton: "ml-auto text-label-lg font-medium text-inverse-primary",
          cancelButton: "text-label-lg font-medium text-inverse-primary",
          error: "bg-error-container text-on-error-container",
        },
      }}
    />
  );
}
