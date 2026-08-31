import { createClient } from "./server";
import type { AppItem, Category, CategorySlug } from "@/data/types";

type AppRow = {
  id: string;
  slug: string;
  name: string;
  category_slug: string;
  short_description: string;
  description: string;
  version: string;
  size: string;
  icon_color: string;
  status: string;
  featured: boolean;
  rating: number;
  rating_count: number;
  screenshots_count: number;
  downloads_count: number;
  updated_at: string;
  developer: { full_name: string | null } | { full_name: string | null }[] | null;
};

const APP_SELECT = "*, developer:profiles!apps_developer_id_fkey(full_name)";

function mapApp(row: AppRow): AppItem {
  const developer = Array.isArray(row.developer) ? row.developer[0] : row.developer;

  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    developer: developer?.full_name || "مطور سندك",
    categorySlug: row.category_slug as CategorySlug,
    shortDescription: row.short_description,
    description: row.description,
    rating: Number(row.rating),
    ratingCount: row.rating_count,
    downloads: row.downloads_count,
    size: row.size,
    version: row.version,
    lastUpdate: row.updated_at,
    iconColor: row.icon_color,
    featured: row.featured,
    screenshotsCount: row.screenshots_count,
    status: row.status as AppItem["status"],
  };
}

export type CurrentUser = {
  id: string;
  email: string | null;
  fullName: string | null;
  role: "user" | "developer" | "admin";
};

export async function getCurrentUser(): Promise<CurrentUser | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, email, role")
    .eq("id", user.id)
    .maybeSingle();

  return {
    id: user.id,
    email: profile?.email ?? user.email ?? null,
    fullName: profile?.full_name ?? null,
    role: profile?.role ?? "user",
  };
}

export async function getCategories(): Promise<Category[]> {
  const supabase = await createClient();
  const { data } = await supabase.from("categories").select("*").order("name");
  return (data ?? []) as Category[];
}

export async function getCategoryBySlug(slug: string): Promise<Category | undefined> {
  const supabase = await createClient();
  const { data } = await supabase.from("categories").select("*").eq("slug", slug).maybeSingle();
  return (data as Category) ?? undefined;
}

export async function getCategoryCounts(): Promise<Record<string, number>> {
  const supabase = await createClient();
  const { data } = await supabase.from("apps").select("category_slug").eq("status", "approved");
  const counts: Record<string, number> = {};
  for (const row of data ?? []) {
    counts[row.category_slug] = (counts[row.category_slug] ?? 0) + 1;
  }
  return counts;
}

export async function getAppBySlug(slug: string): Promise<AppItem | undefined> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("apps")
    .select(APP_SELECT)
    .eq("slug", slug)
    .maybeSingle();
  return data ? mapApp(data as AppRow) : undefined;
}

export async function getFeaturedApps(limit = 8): Promise<AppItem[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("apps")
    .select(APP_SELECT)
    .eq("status", "approved")
    .eq("featured", true)
    .limit(limit);
  return (data ?? []).map((row) => mapApp(row as AppRow));
}

export async function getLatestApps(limit = 8): Promise<AppItem[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("apps")
    .select(APP_SELECT)
    .eq("status", "approved")
    .order("updated_at", { ascending: false })
    .limit(limit);
  return (data ?? []).map((row) => mapApp(row as AppRow));
}

export async function getMostDownloadedApps(limit = 8): Promise<AppItem[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("apps")
    .select(APP_SELECT)
    .eq("status", "approved")
    .order("downloads_count", { ascending: false })
    .limit(limit);
  return (data ?? []).map((row) => mapApp(row as AppRow));
}

export async function getApprovedApps(): Promise<AppItem[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("apps")
    .select(APP_SELECT)
    .eq("status", "approved")
    .order("created_at", { ascending: false });
  return (data ?? []).map((row) => mapApp(row as AppRow));
}

export async function getAppsByCategory(categorySlug: string): Promise<AppItem[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("apps")
    .select(APP_SELECT)
    .eq("status", "approved")
    .eq("category_slug", categorySlug)
    .order("created_at", { ascending: false });
  return (data ?? []).map((row) => mapApp(row as AppRow));
}

export async function getSimilarApps(app: AppItem, limit = 4): Promise<AppItem[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("apps")
    .select(APP_SELECT)
    .eq("status", "approved")
    .eq("category_slug", app.categorySlug)
    .neq("id", app.id)
    .limit(limit);
  return (data ?? []).map((row) => mapApp(row as AppRow));
}

export async function getDeveloperApps(developerId: string): Promise<AppItem[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("apps")
    .select(APP_SELECT)
    .eq("developer_id", developerId)
    .order("created_at", { ascending: false });
  return (data ?? []).map((row) => mapApp(row as AppRow));
}

export async function getDeveloperStats(developerId: string) {
  const apps = await getDeveloperApps(developerId);
  return {
    totalApps: apps.length,
    totalDownloads: apps.reduce((sum, a) => sum + a.downloads, 0),
    publishedApps: apps.filter((a) => a.status === "approved").length,
    pendingApps: apps.filter((a) => a.status === "pending").length,
  };
}

export async function getAllAppsAdmin(): Promise<AppItem[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("apps")
    .select(APP_SELECT)
    .order("created_at", { ascending: false });
  return (data ?? []).map((row) => mapApp(row as AppRow));
}

export async function getPendingApps(): Promise<AppItem[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("apps")
    .select(APP_SELECT)
    .eq("status", "pending")
    .order("created_at", { ascending: true });
  return (data ?? []).map((row) => mapApp(row as AppRow));
}

export async function searchApps(query: string): Promise<AppItem[]> {
  const q = query.trim();
  if (!q) return [];
  const supabase = await createClient();
  const { data } = await supabase
    .from("apps")
    .select(APP_SELECT)
    .eq("status", "approved")
    .or(`name.ilike.%${q}%,short_description.ilike.%${q}%`)
    .limit(30);
  return (data ?? []).map((row) => mapApp(row as AppRow));
}
