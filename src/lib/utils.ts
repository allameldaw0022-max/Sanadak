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

const statusLabels: Record<string, string> = {
  approved: "منشور",
  pending: "قيد المراجعة",
  rejected: "مرفوض",
};

export function getStatusLabel(status: string): string {
  return statusLabels[status] ?? status;
}
