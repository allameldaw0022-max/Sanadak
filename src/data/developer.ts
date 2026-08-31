import type { DeveloperApp } from "./types";

export const currentDeveloper = {
  name: "شركة النيل الرقمية",
  email: "dev@nile-digital.sd",
};

export const developerApps: DeveloperApp[] = [
  {
    id: "d1",
    name: "سوق السودان",
    categorySlug: "shopping",
    version: "3.2.1",
    status: "published",
    downloads: 152000,
    submittedAt: "2026-01-14",
    iconColor: "#16A34A",
  },
  {
    id: "d2",
    name: "سوق المزاد",
    categorySlug: "shopping",
    version: "1.1.2",
    status: "published",
    downloads: 18500,
    submittedAt: "2026-03-02",
    iconColor: "#16A34A",
  },
  {
    id: "d3",
    name: "سوق السودان لايت",
    categorySlug: "shopping",
    version: "0.9.0",
    status: "pending",
    downloads: 0,
    submittedAt: "2026-08-24",
    iconColor: "#15803D",
  },
  {
    id: "d4",
    name: "سوق الجملة",
    categorySlug: "shopping",
    version: "1.0.0",
    status: "pending",
    downloads: 0,
    submittedAt: "2026-08-28",
    iconColor: "#22C55E",
  },
  {
    id: "d5",
    name: "توصيل فوري",
    categorySlug: "delivery",
    version: "2.0.0",
    status: "rejected",
    downloads: 0,
    submittedAt: "2026-06-11",
    iconColor: "#EA580C",
  },
];

export function getDeveloperStats() {
  const totalApps = developerApps.length;
  const totalDownloads = developerApps.reduce((sum, a) => sum + a.downloads, 0);
  const publishedApps = developerApps.filter((a) => a.status === "published").length;
  const pendingApps = developerApps.filter((a) => a.status === "pending").length;
  return { totalApps, totalDownloads, publishedApps, pendingApps };
}
