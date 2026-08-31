export type CategorySlug =
  | "shopping"
  | "finance"
  | "banking"
  | "education"
  | "health"
  | "jobs"
  | "delivery"
  | "transport"
  | "news"
  | "entertainment"
  | "services"
  | "games";

export interface Category {
  slug: CategorySlug;
  name: string;
  icon: string;
  color: string;
}

export type AppStatus = "pending" | "approved" | "rejected";

export interface AppItem {
  id: string;
  slug: string;
  name: string;
  developer: string;
  categorySlug: CategorySlug;
  shortDescription: string;
  description: string;
  rating: number;
  ratingCount: number;
  downloads: number;
  size: string;
  version: string;
  lastUpdate: string;
  iconColor: string;
  featured: boolean;
  screenshotsCount: number;
  status: AppStatus;
  apkPath: string | null;
}

export interface DeveloperApp {
  id: string;
  name: string;
  categorySlug: CategorySlug;
  version: string;
  status: AppStatus;
  downloads: number;
  submittedAt: string;
  iconColor: string;
}
