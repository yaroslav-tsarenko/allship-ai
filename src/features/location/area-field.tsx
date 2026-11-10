"use client";

import type { ComponentType, Ref } from "react";
import { useState } from "react";
import { Combobox, type ComboboxInputProps } from "@/components/ui/combobox";
import type { TextFieldProps } from "@/components/ui/text-field";
import { loadPlaces, type Suggestion } from "./google-places";
import type { LocalPlace } from "./local-places";
import { googleFooter, mapsKey, SuggestionRow, useGoogleAvailable, useGoogleSuggestions, useLocalSuggestions } from "./place-search";

type AreaFieldProps = Omit<TextFieldProps, "value" | "onChange" | "defaultValue"> & {
  value: string;
  onValueChange: (value: string) => void;
  inputComponent?: ComponentType<ComboboxInputProps>;
  popupClassName?: string;
  ref?: Ref<HTMLInputElement>;
};

type AreaItem = { kind: "google"; s: Suggestion } | { kind: "local"; p: LocalPlace };

export function AreaField({ value, onValueChange, inputComponent, popupClassName, onBlur, ref, ...field }: AreaFieldProps) {
  const googleReady = useGoogleAvailable();
  const [typed, setTyped] = useState(false);
  const google = googleReady && !/^\d+$/.test(value.trim());
  const remote = useGoogleSuggestions(value, google && typed, true);
  const local = useLocalSuggestions(value, !google && typed);
  const items: AreaItem[] = google ? remote.items.map((s) => ({ kind: "google" as const, s })) : local.items.map((p) => ({ kind: "local" as const, p }));

  return (
    <Combobox<AreaItem>
      {...field}
      ref={ref}
      value={value}
      onInputChange={(v) => {
        onValueChange(v);
        setTyped(true);
      }}
      onFocus={() => {
        if (googleReady) void loadPlaces(mapsKey);
      }}
      onBlur={onBlur}
      items={items}
      loading={google ? remote.loading : local.loading}
      minChars={google || /^\d/.test(value.trim()) ? 3 : 2}
      itemKey={(i) => (i.kind === "google" ? i.s.id : i.p.label)}
      renderItem={(i) => (i.kind === "google" ? <SuggestionRow main={i.s.main} secondary={i.s.secondary} /> : i.p.postalCode ? <SuggestionRow main={i.p.postalCode} secondary={`${i.p.city}, ${i.p.state}`} /> : <SuggestionRow main={i.p.city} secondary={i.p.state} />)}
      onSelectItem={async (i) => {
        setTyped(false);
        if (i.kind === "local") return onValueChange(i.p.label);
        const hit = await remote.pick(i.s);
        const label = hit && hit.city && hit.state ? `${hit.city}, ${hit.state}${hit.postalCode ? ` ${hit.postalCode}` : ""}` : [i.s.main, i.s.secondary].filter(Boolean).join(", ");
        onValueChange(label);
      }}
      listLabel={`${field.label} suggestions`}
      footer={google ? googleFooter : undefined}
      inputComponent={inputComponent}
      popupClassName={popupClassName}
    />
  );
}
