import type { MetadataRoute } from "next";
import { getApprovedApps, getCategories } from "@/lib/supabase/queries";
import { SITE_URL } from "@/lib/site";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [apps, categories] = await Promise.all([getApprovedApps(), getCategories()]);

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: SITE_URL, changeFrequency: "daily", priority: 1 },
    { url: `${SITE_URL}/apps`, changeFrequency: "daily", priority: 0.9 },
    { url: `${SITE_URL}/categories`, changeFrequency: "weekly", priority: 0.7 },
    { url: `${SITE_URL}/search`, changeFrequency: "weekly", priority: 0.5 },
    { url: `${SITE_URL}/developer/register`, changeFrequency: "monthly", priority: 0.6 },
    { url: `${SITE_URL}/report`, changeFrequency: "monthly", priority: 0.3 },
    { url: `${SITE_URL}/privacy`, changeFrequency: "yearly", priority: 0.2 },
    { url: `${SITE_URL}/terms`, changeFrequency: "yearly", priority: 0.2 },
    { url: `${SITE_URL}/developer-terms`, changeFrequency: "yearly", priority: 0.2 },
  ];

  const categoryRoutes: MetadataRoute.Sitemap = categories.map((category) => ({
    url: `${SITE_URL}/apps?category=${category.slug}`,
    changeFrequency: "weekly",
    priority: 0.6,
  }));

  const appRoutes: MetadataRoute.Sitemap = apps.map((app) => ({
    url: `${SITE_URL}/apps/${app.slug}`,
    lastModified: new Date(app.lastUpdate),
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  return [...staticRoutes, ...categoryRoutes, ...appRoutes];
}
