type EventData = Record<string, string | number | boolean>;
type ProjectEvent =
  | "inquiry_submitted"
  | "newsletter_subscribed"
  | "customer_registered"
  | "bulk_campaign_submitted"
  | "email_draft_generated";

declare global {
  interface Window {
    umami?: { track(name: string, data?: EventData): void | Promise<unknown> };
  }
}

// Replit injects the tracker on published sites. Never load a second tracker.
export function trackProjectEvent(name: ProjectEvent, data?: EventData): void {
  if (typeof window === "undefined") return;
  try {
    const result = window.umami?.track(name, data);
    if (result) void Promise.resolve(result).catch(() => undefined);
  } catch {
    // Telemetry must not interrupt a completed customer action.
  }
}