type EventName =
  | "quote_started"
  | "quote_step"
  | "quote_submitted"
  | "sign_up"
  | "click_to_call"
  | "calculator_used"
  | "newsletter_signup"
  | "contact_submitted"
  | "form_start"
  | "form_step"
  | "lead_partial"
  | "generate_lead";

declare global {
  interface Window {
    dataLayer?: Record<string, unknown>[];
  }
}

export function track(event: EventName, params: Record<string, string | number | boolean | undefined> = {}) {
  if (typeof window === "undefined") return;
  window.dataLayer = window.dataLayer ?? [];
  window.dataLayer.push({ event, ...params });
}
