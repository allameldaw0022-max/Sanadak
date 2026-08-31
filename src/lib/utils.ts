import { clsx, type ClassValue } from "clsx";

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
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
