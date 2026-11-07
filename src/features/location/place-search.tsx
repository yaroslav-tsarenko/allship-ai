"use client";

/// <reference types="google.maps" />
import { useCallback, useEffect, useRef, useState } from "react";
import { publicEnv } from "@/lib/public-env";
import { loadPlaces, onPlacesFailure, placesFailed, resolve, suggest, type Suggestion } from "./google-places";
import { searchLocalPlaces, type LocalPlace } from "./local-places";

export const mapsKey = publicEnv.NEXT_PUBLIC_GOOGLE_MAPS_KEY;

export function useGoogleAvailable() {
  const [ok, setOk] = useState(() => Boolean(mapsKey) && !placesFailed());
  useEffect(() => onPlacesFailure(() => setOk(false)), []);
  return ok;
}

type Remote<T> = { items: T[]; loading: boolean };

export function useGoogleSuggestions(query: string, enabled: boolean, area: boolean) {
  const [state, setState] = useState<Remote<Suggestion>>({ items: [], loading: false });
  const token = useRef<google.maps.places.AutocompleteSessionToken | null>(null);
  const lib = useRef<google.maps.PlacesLibrary | null>(null);

  useEffect(() => {
    const q = query.trim();
    let cancelled = false;
    if (!enabled || q.length < 3) {
      const id = window.setTimeout(() => setState({ items: [], loading: false }), 0);
      return () => window.clearTimeout(id);
    }
    const id = window.setTimeout(async () => {
      setState((s) => ({ ...s, loading: true }));
      lib.current ??= await loadPlaces(mapsKey);
      const places = lib.current;
      if (cancelled) return;
      if (!places) return setState({ items: [], loading: false });
      token.current ??= new places.AutocompleteSessionToken();
      try {
        const items = await suggest(places, q, token.current, area);
        if (!cancelled) setState({ items, loading: false });
      } catch {
        if (!cancelled) setState({ items: [], loading: false });
      }
    }, 220);
    return () => {
      cancelled = true;
      window.clearTimeout(id);
    };
  }, [query, enabled, area]);

  const pick = useCallback(async (s: Suggestion) => {
    const hit = await resolve(s);
    token.current = null;
    setState({ items: [], loading: false });
    return hit;
  }, []);

  return { ...state, pick };
}

export function useLocalSuggestions(query: string, enabled: boolean) {
  const [state, setState] = useState<Remote<LocalPlace>>({ items: [], loading: false });
  useEffect(() => {
    const q = query.trim();
    let cancelled = false;
    if (!enabled || q.length < 2 || /^\d{1,4}$/.test(q)) {
      const id = window.setTimeout(() => setState({ items: [], loading: false }), 0);
      return () => window.clearTimeout(id);
    }
    const id = window.setTimeout(async () => {
      setState((s) => ({ ...s, loading: true }));
      const items = await searchLocalPlaces(q);
      if (!cancelled) setState({ items: items.filter((p) => p.label.toLowerCase() !== q.toLowerCase()), loading: false });
    }, 160);
    return () => {
      cancelled = true;
      window.clearTimeout(id);
    };
  }, [query, enabled]);
  return state;
}

export const googleFooter = <span aria-hidden="true">Powered by Google</span>;

export function SuggestionRow({ main, secondary }: { main: string; secondary?: string }) {
  return (
    <>
      <span className="block truncate">{main}</span>
      {secondary && <span className="block truncate text-body-sm text-on-surface-variant">{secondary}</span>}
    </>
  );
}
