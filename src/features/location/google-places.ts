/// <reference types="google.maps" />

export type PlaceHit = { address: string; city: string; state: string; postalCode: string; lat?: number; lng?: number; placeId: string };

export type Suggestion = { id: string; main: string; secondary: string; prediction: google.maps.places.PlacePrediction };

type MapsWindow = Window & { google?: typeof google; gm_authFailure?: () => void; __allshipMapsReady?: () => void };

let library: Promise<google.maps.PlacesLibrary | null> | null = null;
let failed = false;
const failureListeners = new Set<() => void>();

function markFailed() {
  failed = true;
  failureListeners.forEach((fn) => fn());
}

export function placesFailed() {
  return failed;
}

export function onPlacesFailure(fn: () => void) {
  failureListeners.add(fn);
  return () => {
    failureListeners.delete(fn);
  };
}

function injectScript(key: string) {
  const w = window as MapsWindow;
  return new Promise<void>((resolve, reject) => {
    w.__allshipMapsReady = () => resolve();
    const s = document.createElement("script");
    s.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(key)}&v=weekly&loading=async&libraries=places&language=en&region=US&callback=__allshipMapsReady`;
    s.async = true;
    s.onerror = () => reject(new Error("Google Maps failed to load"));
    document.head.append(s);
  });
}

export function loadPlaces(key: string | undefined): Promise<google.maps.PlacesLibrary | null> {
  if (!key || failed || typeof window === "undefined") return Promise.resolve(null);
  library ??= (async () => {
    const w = window as MapsWindow;
    const previous = w.gm_authFailure;
    w.gm_authFailure = () => {
      previous?.();
      markFailed();
    };
    try {
      if (!w.google?.maps?.importLibrary) await injectScript(key);
      return (await w.google!.maps.importLibrary("places")) as google.maps.PlacesLibrary;
    } catch {
      markFailed();
      return null;
    }
  })();
  return library;
}

export async function suggest(places: google.maps.PlacesLibrary, input: string, token: google.maps.places.AutocompleteSessionToken, area: boolean): Promise<Suggestion[]> {
  try {
    const { suggestions } = await places.AutocompleteSuggestion.fetchAutocompleteSuggestions({
      input,
      sessionToken: token,
      includedRegionCodes: ["us"],
      language: "en-US",
      ...(area ? { includedPrimaryTypes: ["(regions)"] } : {}),
    });
    return suggestions
      .map((s) => s.placePrediction)
      .filter((p): p is google.maps.places.PlacePrediction => Boolean(p))
      .slice(0, 5)
      .map((p) => ({ id: p.placeId, main: p.mainText?.text ?? p.text.text, secondary: (p.secondaryText?.text ?? "").replace(/, USA$/, ""), prediction: p }));
  } catch (err) {
    if (err instanceof Error && /API|key|denied|referer|billing/i.test(err.message)) markFailed();
    throw err;
  }
}

function part(place: google.maps.places.Place, type: string, short = false) {
  const c = place.addressComponents?.find((x) => x.types.includes(type));
  return (short ? c?.shortText : c?.longText) ?? "";
}

export async function resolve(s: Suggestion): Promise<PlaceHit | null> {
  const place = s.prediction.toPlace();
  try {
    await place.fetchFields({ fields: ["addressComponents", "location"] });
  } catch {
    return null;
  }
  const street = [part(place, "street_number"), part(place, "route")].filter(Boolean).join(" ");
  const sub = part(place, "subpremise");
  return {
    address: street ? `${street}${sub ? ` #${sub}` : ""}` : "",
    city: part(place, "locality") || part(place, "sublocality_level_1") || part(place, "sublocality") || part(place, "postal_town") || part(place, "administrative_area_level_3") || part(place, "neighborhood"),
    state: part(place, "administrative_area_level_1", true),
    postalCode: part(place, "postal_code"),
    lat: place.location?.lat(),
    lng: place.location?.lng(),
    placeId: s.id,
  };
}
