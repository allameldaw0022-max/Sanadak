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
