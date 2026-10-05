"use client";

/// <reference types="google.maps" />
import { APIProvider, useMapsLibrary } from "@vis.gl/react-google-maps";
import { useEffect, useId, useRef, useState, type ComponentProps } from "react";
import { TextField } from "@/components/ui/text-field";
import { cn } from "@/lib/cn";

export type PickedAddress = { address: string; city: string; state: string; postalCode: string; lat?: number; lng?: number; placeId: string };

type Props = Omit<ComponentProps<typeof TextField>, "onChange" | "value"> & {
  apiKey: string;
  value: string;
  onValueChange: (value: string) => void;
  onPick: (place: PickedAddress) => void;
};

type Suggestion = { id: string; main: string; secondary: string; prediction: google.maps.places.PlacePrediction };

function component(place: google.maps.places.Place, type: string, short = false) {
  const c = place.addressComponents?.find((x) => x.types.includes(type));
  return (short ? c?.shortText : c?.longText) ?? "";
}

function Inner({ value, onValueChange, onPick, ...field }: Omit<Props, "apiKey">) {
  const places = useMapsLibrary("places");
  const listId = useId();
  const [items, setItems] = useState<Suggestion[]>([]);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const session = useRef<google.maps.places.AutocompleteSessionToken | null>(null);
  const typed = useRef(false);

  useEffect(() => {
    if (!places || !typed.current) return;
    const input = value.trim();
    if (input.length < 3) {
      const id = window.setTimeout(() => setItems([]), 0);
      return () => window.clearTimeout(id);
    }
    let cancelled = false;
    const id = window.setTimeout(async () => {
      session.current ??= new places.AutocompleteSessionToken();
      try {
        const { suggestions } = await places.AutocompleteSuggestion.fetchAutocompleteSuggestions({ input, includedRegionCodes: ["us"], sessionToken: session.current, includedPrimaryTypes: ["street_address", "premise", "subpremise", "route"] });
        if (cancelled) return;
        setItems(
          suggestions
            .map((s) => s.placePrediction)
            .filter((p): p is google.maps.places.PlacePrediction => Boolean(p))
            .slice(0, 5)
            .map((p) => ({ id: p.placeId, main: p.mainText?.text ?? p.text.text, secondary: p.secondaryText?.text ?? "", prediction: p })),
        );
        setOpen(true);
        setActive(-1);
      } catch {
        if (!cancelled) setItems([]);
      }
    }, 220);
    return () => {
      cancelled = true;
      window.clearTimeout(id);
    };
  }, [places, value]);

  const pick = async (s: Suggestion) => {
    setOpen(false);
    setItems([]);
    const place = s.prediction.toPlace();
    session.current = null;
    try {
      await place.fetchFields({ fields: ["addressComponents", "location"] });
    } catch {
      onValueChange(s.main);
      return;
    }
    const street = [component(place, "street_number"), component(place, "route")].filter(Boolean).join(" ") || s.main;
    typed.current = false;
    onPick({
      address: street,
      city: component(place, "locality") || component(place, "sublocality") || component(place, "postal_town") || component(place, "administrative_area_level_3"),
      state: component(place, "administrative_area_level_1", true),
      postalCode: component(place, "postal_code"),
      lat: place.location?.lat(),
      lng: place.location?.lng(),
      placeId: s.id,
    });
  };

  const expanded = open && items.length > 0;

  return (
    <div className="relative">
      <TextField
        {...field}
        value={value}
        role="combobox"
        aria-expanded={expanded}
        aria-controls={listId}
        aria-autocomplete="list"
        aria-activedescendant={expanded && active >= 0 ? `${listId}-${active}` : undefined}
        autoComplete="off"
        onChange={(e) => {
          typed.current = true;
          onValueChange(e.target.value);
        }}
        onBlur={(e) => {
          window.setTimeout(() => setOpen(false), 150);
          field.onBlur?.(e);
        }}
        onKeyDown={(e) => {
          if (!expanded) return;
          if (e.key === "ArrowDown") {
            e.preventDefault();
            setActive((i) => (i + 1) % items.length);
          } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setActive((i) => (i <= 0 ? items.length - 1 : i - 1));
          } else if (e.key === "Enter" && active >= 0) {
            e.preventDefault();
            void pick(items[active]!);
          } else if (e.key === "Escape") {
            setOpen(false);
          }
        }}
      />
      {expanded && (
        <ul id={listId} role="listbox" className="absolute inset-x-0 top-[60px] z-30 overflow-hidden rounded-xs bg-surface-container py-2 shadow-elevation-2">
          {items.map((s, i) => (
            <li
              key={s.id}
              id={`${listId}-${i}`}
              role="option"
              aria-selected={i === active}
              onMouseDown={(e) => {
                e.preventDefault();
                void pick(s);
              }}
              className={cn("cursor-pointer px-4 py-2.5", i === active ? "bg-on-surface/8" : "hover:bg-on-surface/8")}
            >
              <span className="block text-body-lg text-on-surface">{s.main}</span>
              {s.secondary && <span className="block text-body-sm text-on-surface-variant">{s.secondary}</span>}
            </li>
          ))}
          <li role="presentation" className="px-4 pt-2 text-right text-label-sm text-on-surface-variant">
            Powered by Google
          </li>
        </ul>
      )}
    </div>
  );
}

export default function AddressAutocomplete({ apiKey, ...props }: Props) {
  return (
    <APIProvider apiKey={apiKey} libraries={["places"]}>
      <Inner {...props} />
    </APIProvider>
  );
}
