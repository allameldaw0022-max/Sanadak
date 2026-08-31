import { createClient } from "./server";
import type { AppItem, AppStatus, Category, CategorySlug } from "@/data/types";
import { getCategoryBySlug as getStaticCategoryBySlug } from "@/data/categories";
import type { SubscriptionPlan, SubscriptionStatus, PaymentStatus } from "@/lib/subscription";
import { computeDisplayState } from "@/lib/subscription";

type AppRow = {
  id: string;
  slug: string;
  name: string;
  developer_id: string;
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
    developerId: row.developer_id,
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
  const q = query.trim().toLowerCase();
  if (!q) return [];
  const supabase = await createClient();
  const { data } = await supabase
    .from("apps")
    .select(APP_SELECT)
    .eq("status", "approved");

  const apps = (data ?? []).map((row) => mapApp(row as AppRow));

  return apps
    .filter((app) => {
      const category = getStaticCategoryBySlug(app.categorySlug);
      return (
        app.name.toLowerCase().includes(q) ||
        app.developer.toLowerCase().includes(q) ||
        app.shortDescription.toLowerCase().includes(q) ||
        (category?.name.toLowerCase().includes(q) ?? false)
      );
    })
    .slice(0, 30);
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

// ---------------------------------------------------------------------------
// Reviews
// ---------------------------------------------------------------------------

export type AppReview = {
  id: string;
  rating: number;
  comment: string | null;
  createdAt: string;
  userId: string;
  userName: string;
};

type ReviewRow = {
  id: string;
  rating: number;
  comment: string | null;
  created_at: string;
  user_id: string;
  reviewer: { full_name: string | null } | { full_name: string | null }[] | null;
};

export async function getAppReviews(appId: string): Promise<AppReview[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("reviews")
    .select("id, rating, comment, created_at, user_id, reviewer:profiles!reviews_user_id_fkey(full_name)")
    .eq("app_id", appId)
    .order("created_at", { ascending: false });

  return ((data ?? []) as ReviewRow[]).map((row) => {
    const reviewer = Array.isArray(row.reviewer) ? row.reviewer[0] : row.reviewer;
    return {
      id: row.id,
      rating: row.rating,
      comment: row.comment,
      createdAt: row.created_at,
      userId: row.user_id,
      userName: reviewer?.full_name || "مستخدم سندك",
    };
  });
}

export async function getMyReviewForApp(appId: string, userId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("reviews")
    .select("id, rating, comment")
    .eq("app_id", appId)
    .eq("user_id", userId)
    .maybeSingle();
  return data;
}

// ---------------------------------------------------------------------------
// Developer profile (public)
// ---------------------------------------------------------------------------

export type DeveloperProfile = {
  id: string;
  fullName: string;
  totalApps: number;
  totalDownloads: number;
};

export async function getDeveloperProfile(developerId: string): Promise<DeveloperProfile | undefined> {
  const supabase = await createClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("id, full_name")
    .eq("id", developerId)
    .maybeSingle();

  if (!profile) return undefined;

  const { data: apps } = await supabase
    .from("apps")
    .select("downloads_count")
    .eq("developer_id", developerId)
    .eq("status", "approved");

  return {
    id: profile.id,
    fullName: profile.full_name || "مطور سندك",
    totalApps: apps?.length ?? 0,
    totalDownloads: (apps ?? []).reduce((sum, a) => sum + a.downloads_count, 0),
  };
}

// ---------------------------------------------------------------------------
// App reports
// ---------------------------------------------------------------------------

export type AdminReport = {
  id: string;
  appId: string;
  appName: string;
  reason: string;
  details: string | null;
  status: string;
  adminNote: string | null;
  reporterEmail: string | null;
  createdAt: string;
};

type AdminReportRow = {
  id: string;
  app_id: string;
  reason: string;
  details: string | null;
  status: string;
  admin_note: string | null;
  created_at: string;
  app: { name: string } | { name: string }[] | null;
  reporter: { email: string | null } | { email: string | null }[] | null;
};

export async function getAdminReports(): Promise<AdminReport[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("app_reports")
    .select(
      "id, app_id, reason, details, status, admin_note, created_at, app:apps(name), reporter:profiles(email)"
    )
    .order("created_at", { ascending: false });

  return ((data ?? []) as AdminReportRow[]).map((row) => {
    const app = Array.isArray(row.app) ? row.app[0] : row.app;
    const reporter = Array.isArray(row.reporter) ? row.reporter[0] : row.reporter;
    return {
      id: row.id,
      appId: row.app_id,
      appName: app?.name ?? "—",
      reason: row.reason,
      details: row.details,
      status: row.status,
      adminNote: row.admin_note,
      reporterEmail: reporter?.email ?? null,
      createdAt: row.created_at,
    };
  });
}

// ---------------------------------------------------------------------------
// Subscriptions & payments
// ---------------------------------------------------------------------------

export type PaymentSettings = {
  bankName: string;
  accountHolderName: string;
  accountNumber: string;
  iban: string;
  phone: string;
  paymentMethodName: string;
  paymentInstructions: string;
  usdToSdgRate: number;
  basicPriceUsd: number;
  proPriceUsd: number;
  basicMaxApps: number;
  freeTrialMaxDevelopers: number;
  freeTrialDays: number;
  gracePeriodDays: number;
  updatedAt: string;
};

function mapPaymentSettings(row: {
  bank_name: string;
  account_holder_name: string;
  account_number: string;
  iban: string;
  phone: string;
  payment_method_name: string;
  payment_instructions: string;
  usd_to_sdg_rate: number;
  basic_price_usd: number;
  pro_price_usd: number;
  basic_max_apps: number;
  free_trial_max_developers: number;
  free_trial_days: number;
  grace_period_days: number;
  updated_at: string;
}): PaymentSettings {
  return {
    bankName: row.bank_name,
    accountHolderName: row.account_holder_name,
    accountNumber: row.account_number,
    iban: row.iban,
    phone: row.phone,
    paymentMethodName: row.payment_method_name,
    paymentInstructions: row.payment_instructions,
    usdToSdgRate: Number(row.usd_to_sdg_rate),
    basicPriceUsd: Number(row.basic_price_usd),
    proPriceUsd: Number(row.pro_price_usd),
    basicMaxApps: row.basic_max_apps,
    freeTrialMaxDevelopers: row.free_trial_max_developers,
    freeTrialDays: row.free_trial_days,
    gracePeriodDays: row.grace_period_days,
    updatedAt: row.updated_at,
  };
}

export async function getPaymentSettings(): Promise<PaymentSettings | null> {
  const supabase = await createClient();
  const { data } = await supabase.from("payment_settings").select("*").eq("id", 1).maybeSingle();
  return data ? mapPaymentSettings(data) : null;
}

export type DeveloperSubscription = {
  plan: SubscriptionPlan | null;
  status: SubscriptionStatus;
  isFreeTrial: boolean;
  maxApps: number | null;
  startedAt: string | null;
  expiresAt: string | null;
  appCount: number;
  displayState: ReturnType<typeof computeDisplayState>;
  pendingPaymentRequest: { id: string; plan: SubscriptionPlan; createdAt: string } | null;
};

export async function getDeveloperSubscription(
  developerId: string
): Promise<DeveloperSubscription | null> {
  const supabase = await createClient();

  await supabase.rpc("sync_subscription_status", { p_developer_id: developerId });

  const [{ data: sub }, { count: appCount }, { data: pending }] = await Promise.all([
    supabase
      .from("subscriptions")
      .select("plan, status, is_free_trial, max_apps, started_at, expires_at")
      .eq("developer_id", developerId)
      .maybeSingle(),
    supabase
      .from("apps")
      .select("id", { count: "exact", head: true })
      .eq("developer_id", developerId),
    supabase
      .from("payment_requests")
      .select("id, plan, created_at")
      .eq("developer_id", developerId)
      .eq("status", "pending")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  if (!sub) return null;

  return {
    plan: sub.plan,
    status: sub.status,
    isFreeTrial: sub.is_free_trial,
    maxApps: sub.max_apps,
    startedAt: sub.started_at,
    expiresAt: sub.expires_at,
    appCount: appCount ?? 0,
    displayState: computeDisplayState(sub.status, !!pending),
    pendingPaymentRequest: pending
      ? { id: pending.id, plan: pending.plan, createdAt: pending.created_at }
      : null,
  };
}

export type PaymentRequestSummary = {
  id: string;
  plan: SubscriptionPlan;
  amountUsd: number;
  amountSdg: number;
  status: PaymentStatus;
  adminNote: string | null;
  createdAt: string;
  reviewedAt: string | null;
};

export async function getDeveloperPaymentRequests(
  developerId: string
): Promise<PaymentRequestSummary[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("payment_requests")
    .select("id, plan, amount_usd, amount_sdg, status, admin_note, created_at, reviewed_at")
    .eq("developer_id", developerId)
    .order("created_at", { ascending: false });

  return (data ?? []).map((row) => ({
    id: row.id,
    plan: row.plan,
    amountUsd: Number(row.amount_usd),
    amountSdg: Number(row.amount_sdg),
    status: row.status,
    adminNote: row.admin_note,
    createdAt: row.created_at,
    reviewedAt: row.reviewed_at,
  }));
}

export type AdminPaymentRequest = {
  id: string;
  developerId: string;
  developerName: string;
  developerEmail: string | null;
  plan: SubscriptionPlan;
  amountUsd: number;
  exchangeRate: number;
  amountSdg: number;
  payerName: string;
  transactionReference: string;
  transferDate: string;
  status: PaymentStatus;
  createdAt: string;
};

const ADMIN_PAYMENT_LIST_SELECT =
  "id, developer_id, plan, amount_usd, exchange_rate, amount_sdg, payer_name, transaction_reference, transfer_date, status, created_at, developer:profiles!payment_requests_developer_id_fkey(full_name, email)";

type AdminPaymentListRow = {
  id: string;
  developer_id: string;
  plan: SubscriptionPlan;
  amount_usd: number;
  exchange_rate: number;
  amount_sdg: number;
  payer_name: string;
  transaction_reference: string;
  transfer_date: string;
  status: PaymentStatus;
  created_at: string;
  developer:
    | { full_name: string | null; email: string | null }
    | { full_name: string | null; email: string | null }[]
    | null;
};

export async function getAdminPaymentRequests(): Promise<AdminPaymentRequest[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("payment_requests")
    .select(ADMIN_PAYMENT_LIST_SELECT)
    .order("created_at", { ascending: false });

  return ((data ?? []) as AdminPaymentListRow[]).map((row) => {
    const developer = Array.isArray(row.developer) ? row.developer[0] : row.developer;
    return {
      id: row.id,
      developerId: row.developer_id,
      developerName: developer?.full_name || "مطور سندك",
      developerEmail: developer?.email ?? null,
      plan: row.plan,
      amountUsd: Number(row.amount_usd),
      exchangeRate: Number(row.exchange_rate),
      amountSdg: Number(row.amount_sdg),
      payerName: row.payer_name,
      transactionReference: row.transaction_reference,
      transferDate: row.transfer_date,
      status: row.status,
      createdAt: row.created_at,
    };
  });
}

export type AdminPaymentRequestDetail = AdminPaymentRequest & {
  note: string | null;
  adminNote: string | null;
  reviewedByName: string | null;
  reviewedAt: string | null;
  proofSignedUrl: string | null;
};

export async function getAdminPaymentRequestById(
  id: string
): Promise<AdminPaymentRequestDetail | undefined> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("payment_requests")
    .select(
      "id, developer_id, plan, amount_usd, exchange_rate, amount_sdg, payer_name, transaction_reference, transfer_date, proof_path, note, status, admin_note, reviewed_at, created_at, developer:profiles!payment_requests_developer_id_fkey(full_name, email), reviewer:profiles!payment_requests_reviewed_by_fkey(full_name)"
    )
    .eq("id", id)
    .maybeSingle();

  if (!data) return undefined;

  const developer = Array.isArray(data.developer) ? data.developer[0] : data.developer;
  const reviewer = Array.isArray(data.reviewer) ? data.reviewer[0] : data.reviewer;

  let proofSignedUrl: string | null = null;
  if (data.proof_path) {
    const { data: signed } = await supabase.storage
      .from("payment-proofs")
      .createSignedUrl(data.proof_path, 300);
    proofSignedUrl = signed?.signedUrl ?? null;
  }

  return {
    id: data.id,
    developerId: data.developer_id,
    developerName: developer?.full_name || "مطور سندك",
    developerEmail: developer?.email ?? null,
    plan: data.plan,
    amountUsd: Number(data.amount_usd),
    exchangeRate: Number(data.exchange_rate),
    amountSdg: Number(data.amount_sdg),
    payerName: data.payer_name,
    transactionReference: data.transaction_reference,
    transferDate: data.transfer_date,
    status: data.status,
    createdAt: data.created_at,
    note: data.note,
    adminNote: data.admin_note,
    reviewedByName: reviewer?.full_name ?? null,
    reviewedAt: data.reviewed_at,
    proofSignedUrl,
  };
}

export type AdminPaymentStats = {
  pendingCount: number;
  approvedCount: number;
  rejectedCount: number;
  totalCount: number;
  revenueThisMonthUsd: number;
  revenueThisYearUsd: number;
  activeBasicCount: number;
  activeProCount: number;
  trialCount: number;
};

export async function getAdminPaymentStats(): Promise<AdminPaymentStats> {
  const supabase = await createClient();
  const [{ data: requests }, { data: subs }] = await Promise.all([
    supabase.from("payment_requests").select("status, amount_usd, reviewed_at"),
    supabase.from("subscriptions").select("plan, status"),
  ]);

  const list = requests ?? [];
  const now = new Date();
  const thisYear = now.getFullYear();
  const thisMonth = now.getMonth();

  let revenueThisMonthUsd = 0;
  let revenueThisYearUsd = 0;
  for (const r of list) {
    if (r.status !== "approved" || !r.reviewed_at) continue;
    const d = new Date(r.reviewed_at);
    if (d.getFullYear() === thisYear) {
      revenueThisYearUsd += Number(r.amount_usd);
      if (d.getMonth() === thisMonth) revenueThisMonthUsd += Number(r.amount_usd);
    }
  }

  const subList = subs ?? [];

  return {
    pendingCount: list.filter((r) => r.status === "pending").length,
    approvedCount: list.filter((r) => r.status === "approved").length,
    rejectedCount: list.filter((r) => r.status === "rejected").length,
    totalCount: list.length,
    revenueThisMonthUsd,
    revenueThisYearUsd,
    activeBasicCount: subList.filter((s) => s.status === "active" && s.plan === "basic").length,
    activeProCount: subList.filter((s) => s.status === "active" && s.plan === "pro").length,
    trialCount: subList.filter((s) => s.status === "trial").length,
  };
}
