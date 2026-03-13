/**
 * ASCO Design System — Theme Constants & Types
 * Single source of truth for brand values in TypeScript.
 */

export type Theme = "light" | "dark" | "system";

export type BrandColor = "cobalt" | "cobalt-deep" | "cobalt-light" | "cobalt-lighter" | "pale-blue" | "teal" | "muted-grey";

export type StatusColor = "new" | "active" | "complete" | "urgent" | "waiting";

/** Hex reference values — use Tailwind classes in components, not these directly */
export const BRAND_COLORS = {
  cobalt: {
    deep: "#1E2030",
    DEFAULT: "#292C3F",
    light: "#323650",
    lighter: "#3C4165",
  },
  paleBlue: "#CFCED8",
  teal: "#00FDC7",
  mutedGrey: "#8F8C90",
} as const;

export const STATUS_COLORS = {
  new: "#00FDC7",
  active: "#F59E0B",
  complete: "#16A34A",
  urgent: "#DC2626",
  waiting: "#8F8C90",
} as const;

/** Map a work order status string to the corresponding Tailwind class */
export function getStatusColor(status: string): string {
  const map: Record<string, string> = {
    pending: "text-status-new",
    new: "text-status-new",
    in_progress: "text-status-active",
    active: "text-status-active",
    completed: "text-status-complete",
    complete: "text-status-complete",
    urgent: "text-status-urgent",
    cancelled: "text-status-waiting",
    paused: "text-status-waiting",
    waiting: "text-status-waiting",
  };
  return map[status.toLowerCase()] ?? "text-muted-foreground";
}

/** Map a work order status string to a background Tailwind class */
export function getStatusBgColor(status: string): string {
  const map: Record<string, string> = {
    pending: "bg-status-new/15",
    new: "bg-status-new/15",
    in_progress: "bg-status-active/15",
    active: "bg-status-active/15",
    completed: "bg-status-complete/15",
    complete: "bg-status-complete/15",
    urgent: "bg-status-urgent/15",
    cancelled: "bg-status-waiting/15",
    paused: "bg-status-waiting/15",
    waiting: "bg-status-waiting/15",
  };
  return map[status.toLowerCase()] ?? "bg-muted";
}
