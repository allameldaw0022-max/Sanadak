import type { Category } from "./types";

export const categories: Category[] = [
  { slug: "shopping", name: "تسوق", icon: "ShoppingBag", color: "#16A34A" },
  { slug: "finance", name: "مال وأعمال", icon: "Wallet", color: "#0EA5E9" },
  { slug: "banking", name: "بنوك ودفع", icon: "Landmark", color: "#0F172A" },
  { slug: "education", name: "تعليم", icon: "GraduationCap", color: "#7C3AED" },
  { slug: "health", name: "صحة", icon: "HeartPulse", color: "#DC2626" },
  { slug: "jobs", name: "وظائف", icon: "Briefcase", color: "#B45309" },
  { slug: "delivery", name: "توصيل", icon: "Truck", color: "#EA580C" },
  { slug: "transport", name: "مواصلات", icon: "Bus", color: "#0891B2" },
  { slug: "news", name: "أخبار", icon: "Newspaper", color: "#334155" },
  { slug: "entertainment", name: "ترفيه", icon: "Clapperboard", color: "#DB2777" },
  { slug: "services", name: "خدمات", icon: "Wrench", color: "#4D7C0F" },
  { slug: "games", name: "ألعاب", icon: "Gamepad2", color: "#9333EA" },
];

export function getCategoryBySlug(slug: string): Category | undefined {
  return categories.find((c) => c.slug === slug);
}
