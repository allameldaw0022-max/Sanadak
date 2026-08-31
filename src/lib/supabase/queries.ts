import { createClient } from "./server";
import type { AppItem, AppStatus, Category, CategorySlug } from "@/data/types";
import { getCategoryBySlug as getStaticCategoryBySlug } from "@/data/categories";

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
  apk_path: string | null;
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
    apkPath: row.apk_path,
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

// ---------------------------------------------------------------------------
// Admin dashboard
// ---------------------------------------------------------------------------

export type AdminStats = {
  totalApps: number;
  approvedApps: number;
  pendingApps: number;
  rejectedApps: number;
  totalDevelopers: number;
  totalUsers: number;
  totalDownloads: number;
};

export async function getAdminStats(): Promise<AdminStats> {
  const supabase = await createClient();
  const [{ data: apps }, { count: totalDevelopers }, { count: totalUsers }] = await Promise.all([
    supabase.from("apps").select("status, downloads_count"),
    supabase.from("profiles").select("id", { count: "exact", head: true }).eq("role", "developer"),
    supabase.from("profiles").select("id", { count: "exact", head: true }).eq("role", "user"),
  ]);

  const list = apps ?? [];

  return {
    totalApps: list.length,
    approvedApps: list.filter((a) => a.status === "approved").length,
    pendingApps: list.filter((a) => a.status === "pending").length,
    rejectedApps: list.filter((a) => a.status === "rejected").length,
    totalDevelopers: totalDevelopers ?? 0,
    totalUsers: totalUsers ?? 0,
    totalDownloads: list.reduce((sum, a) => sum + (a.downloads_count ?? 0), 0),
  };
}

type AdminAppListRow = {
  id: string;
  slug: string;
  name: string;
  icon_color: string;
  developer_id: string;
  category_slug: string;
  version: string;
  size: string;
  status: AppStatus;
  downloads_count: number;
  created_at: string;
  developer: { full_name: string | null } | { full_name: string | null }[] | null;
};

export type AdminAppListItem = {
  id: string;
  slug: string;
  name: string;
  iconColor: string;
  developerId: string;
  developerName: string;
  categorySlug: string;
  categoryName: string;
  version: string;
  size: string;
  status: AppStatus;
  downloadsCount: number;
  createdAt: string;
};

const ADMIN_APP_LIST_SELECT =
  "id, slug, name, icon_color, developer_id, category_slug, version, size, status, downloads_count, created_at, developer:profiles!apps_developer_id_fkey(full_name)";

function mapAdminAppListRow(row: AdminAppListRow): AdminAppListItem {
  const developer = Array.isArray(row.developer) ? row.developer[0] : row.developer;
  const category = getStaticCategoryBySlug(row.category_slug);

  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    iconColor: row.icon_color,
    developerId: row.developer_id,
    developerName: developer?.full_name || "مطور سندك",
    categorySlug: row.category_slug,
    categoryName: category?.name ?? row.category_slug,
    version: row.version,
    size: row.size,
    status: row.status,
    downloadsCount: row.downloads_count,
    createdAt: row.created_at,
  };
}

export async function getAdminApps(): Promise<AdminAppListItem[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("apps")
    .select(ADMIN_APP_LIST_SELECT)
    .order("created_at", { ascending: false });

  return (data ?? []).map((row) => mapAdminAppListRow(row as AdminAppListRow));
}

export type AdminAppDetail = AdminAppListItem & {
  shortDescription: string;
  description: string;
  screenshotsCount: number;
  apkPath: string | null;
  rejectionReason: string | null;
  reviewedAt: string | null;
  reviewerName: string | null;
  developerEmail: string | null;
};

type AdminAppDetailRow = AdminAppListRow & {
  short_description: string;
  description: string;
  screenshots_count: number;
  apk_path: string | null;
  rejection_reason: string | null;
  reviewed_at: string | null;
  developer_full: { full_name: string | null; email: string | null } | { full_name: string | null; email: string | null }[] | null;
  reviewer: { full_name: string | null } | { full_name: string | null }[] | null;
};

export async function getAdminAppById(id: string): Promise<AdminAppDetail | undefined> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("apps")
    .select(
      `id, slug, name, icon_color, developer_id, category_slug, version, size, status, downloads_count,
       created_at, short_description, description, screenshots_count, apk_path, rejection_reason, reviewed_at,
       developer_full:profiles!apps_developer_id_fkey(full_name, email),
       reviewer:profiles!apps_reviewed_by_fkey(full_name)`
    )
    .eq("id", id)
    .maybeSingle();

  if (!data) return undefined;

  const row = data as unknown as AdminAppDetailRow;
  const developerFull = Array.isArray(row.developer_full) ? row.developer_full[0] : row.developer_full;
  const reviewer = Array.isArray(row.reviewer) ? row.reviewer[0] : row.reviewer;
  const category = getStaticCategoryBySlug(row.category_slug);

  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    iconColor: row.icon_color,
    developerId: row.developer_id,
    developerName: developerFull?.full_name || "مطور سندك",
    developerEmail: developerFull?.email ?? null,
    categorySlug: row.category_slug,
    categoryName: category?.name ?? row.category_slug,
    version: row.version,
    size: row.size,
    status: row.status,
    downloadsCount: row.downloads_count,
    createdAt: row.created_at,
    shortDescription: row.short_description,
    description: row.description,
    screenshotsCount: row.screenshots_count,
    apkPath: row.apk_path,
    rejectionReason: row.rejection_reason,
    reviewedAt: row.reviewed_at,
    reviewerName: reviewer?.full_name ?? null,
  };
}

export type AdminDeveloper = {
  id: string;
  fullName: string;
  email: string;
  createdAt: string;
  totalApps: number;
  approvedApps: number;
  pendingApps: number;
};

export async function getAdminDevelopers(): Promise<AdminDeveloper[]> {
  const supabase = await createClient();
  const [{ data: developers }, { data: apps }] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, full_name, email, created_at")
      .eq("role", "developer")
      .order("created_at", { ascending: false }),
    supabase.from("apps").select("developer_id, status"),
  ]);

  return (developers ?? []).map((dev) => {
    const devApps = (apps ?? []).filter((a) => a.developer_id === dev.id);
    return {
      id: dev.id,
      fullName: dev.full_name || "مطور سندك",
      email: dev.email || "",
      createdAt: dev.created_at,
      totalApps: devApps.length,
      approvedApps: devApps.filter((a) => a.status === "approved").length,
      pendingApps: devApps.filter((a) => a.status === "pending").length,
    };
  });
}

export type AdminUserRow = {
  id: string;
  fullName: string;
  email: string;
  role: "user" | "developer" | "admin";
  createdAt: string;
};

export async function getAdminUsers(): Promise<AdminUserRow[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("profiles")
    .select("id, full_name, email, role, created_at")
    .order("created_at", { ascending: false });

  return (data ?? []).map((row) => ({
    id: row.id,
    fullName: row.full_name || "—",
    email: row.email || "",
    role: row.role,
    createdAt: row.created_at,
  }));
}

type AdminDownloadRow = {
  id: string;
  downloaded_at: string;
  app: { name: string; icon_color: string } | { name: string; icon_color: string }[] | null;
};

export type AdminDownload = {
  id: string;
  appName: string;
  appIconColor: string;
  downloadedAt: string;
};

export async function getAdminDownloads(limit = 200): Promise<AdminDownload[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("app_downloads")
    .select("id, downloaded_at, app:apps(name, icon_color)")
    .order("downloaded_at", { ascending: false })
    .limit(limit);

  return ((data ?? []) as AdminDownloadRow[]).map((row) => {
    const app = Array.isArray(row.app) ? row.app[0] : row.app;
    return {
      id: row.id,
      appName: app?.name ?? "—",
      appIconColor: app?.icon_color ?? "#16A34A",
      downloadedAt: row.downloaded_at,
    };
  });
}
