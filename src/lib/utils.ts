import { clsx, type ClassValue } from "clsx";

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

export function getIconPublicUrl(iconPath: string | null): string | null {
  if (!iconPath) return null;
  return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/app-icons/${iconPath}`;
}

// Safe to embed inside a <script type="application/ld+json"> via
// dangerouslySetInnerHTML. Plain JSON.stringify does not escape "<", so
// user-controlled text (an app name/description) containing a literal
// "</script>" would close the script tag early and let anything after it
// run as real markup/script in every visitor's browser — a classic stored
// XSS vector for JSON-LD. Escaping "<" as < (valid inside a JSON
// string, inert in HTML) closes that off without altering the JSON value.
export function safeJsonLd(data: unknown): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}

export function formatDownloads(count: number): string {
  if (count >= 1_000_000) {
    return `${(count / 1_000_000).toFixed(1).replace(/\.0$/, "")} مليون+`;
  }
  if (count >= 1_000) {
    return `${(count / 1_000).toFixed(0)} ألف+`;
  }
  return `${count}+`;
}

// Whole days between now and dateString (negative once it's in the past).
// Kept as a plain helper rather than inline in a component -- calling
// Date.now() directly inside a component/hook body trips the
// react-hooks/purity rule (components must be idempotent); a component
// calling this ordinary function does not.
export function daysUntil(dateString: string): number {
  return Math.floor((new Date(dateString).getTime() - Date.now()) / (24 * 60 * 60 * 1000));
}

export type DeviceUsageState = "normal" | "near" | "reached";

// Same threshold a dealer subscription's usage bar/copy uses (see
// PlanStatusCard) -- 80% is "near", 100%+ is "reached". Kept as a small
// pure, alias-free function so it's covered by a real runnable test.
const NEAR_DEVICE_LIMIT_RATIO = 0.8;

export function getDeviceUsageState(usedDevices: number, maxDevices: number): DeviceUsageState {
  const ratio = maxDevices > 0 ? usedDevices / maxDevices : 0;
  if (ratio >= 1) return "reached";
  if (ratio >= NEAR_DEVICE_LIMIT_RATIO) return "near";
  return "normal";
}

export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat("ar-SD", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(date);
}

export function formatShortDate(dateString: string): string {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat("ar-SD", {
    day: "numeric",
    month: "numeric",
    year: "2-digit",
  }).format(date);
}

export function formatDateTime(dateString: string): string {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat("ar-SD", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

const statusLabels: Record<string, string> = {
  approved: "منشور",
  pending: "قيد المراجعة",
  rejected: "مرفوض",
};

export function getStatusLabel(status: string): string {
  return statusLabels[status] ?? status;
}
