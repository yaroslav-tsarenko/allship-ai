"use client";

import { useEffect } from "react";
import { get, useFormContext, useWatch } from "react-hook-form";

export function useLiveRevalidation(...names: string[]) {
  const { control, trigger, formState } = useFormContext();
  const values = useWatch({ control, name: names });
  const key = names.join("|");
  const hasErrors = names.some((n) => Boolean(get(formState.errors, n)));
  useEffect(() => {
    if (!hasErrors) return;
    const id = window.setTimeout(() => void trigger(key.split("|")), 250);
    return () => window.clearTimeout(id);
  }, [values, hasErrors, trigger, key]);
}
