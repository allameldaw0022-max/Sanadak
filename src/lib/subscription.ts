export type SubscriptionPlan = "trial" | "basic" | "pro";
export type SubscriptionStatus = "trial" | "active" | "expired" | "suspended";
export type PaymentStatus = "pending" | "approved" | "rejected" | "cancelled";

export type DisplaySubscriptionState =
  | "active"
  | "trial"
  | "pending_payment"
  | "expired"
  | "suspended";

export const planLabels: Record<SubscriptionPlan, string> = {
  trial: "تجربة مجانية",
  basic: "الخطة الأساسية",
  pro: "الخطة الاحترافية",
};

export const planPickLabels: Record<"basic" | "pro", string> = {
  basic: "الأساسية",
  pro: "الاحترافية",
};

export const displayStateInfo: Record<
  DisplaySubscriptionState,
  { emoji: string; label: string; className: string }
> = {
  active: { emoji: "🟢", label: "نشط", className: "bg-primary-light text-primary-dark" },
  trial: { emoji: "🟡", label: "تجربة مجانية", className: "bg-amber-50 text-amber-700" },
  pending_payment: { emoji: "🟠", label: "بانتظار الدفع", className: "bg-orange-50 text-orange-700" },
  expired: { emoji: "🔴", label: "منتهي", className: "bg-red-50 text-red-600" },
  suspended: { emoji: "🔴", label: "موقوف", className: "bg-red-50 text-red-600" },
};

export const paymentStatusLabels: Record<PaymentStatus, string> = {
  pending: "بانتظار المراجعة",
  approved: "مقبول",
  rejected: "مرفوض",
  cancelled: "ملغى",
};

export const paymentStatusStyles: Record<PaymentStatus, string> = {
  pending: "bg-amber-50 text-amber-700",
  approved: "bg-primary-light text-primary-dark",
  rejected: "bg-red-50 text-red-600",
  cancelled: "bg-slate-100 text-slate-500",
};

export function computeDisplayState(
  status: SubscriptionStatus,
  hasPendingPayment: boolean
): DisplaySubscriptionState {
  if (status === "suspended") return "suspended";
  if (hasPendingPayment) return "pending_payment";
  if (status === "trial") return "trial";
  if (status === "active") return "active";
  return "expired";
}

export function daysUntil(dateString: string | null): number | null {
  if (!dateString) return null;
  const diffMs = new Date(dateString).getTime() - Date.now();
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
}

export function formatUsd(amount: number): string {
  return `$${amount.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
}

export function formatSdg(amount: number): string {
  return `${amount.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 2 })} SDG`;
}

export function formatExchangeRate(rate: number): string {
  return `1 USD = ${rate.toLocaleString("en-US", { maximumFractionDigits: 4 })} SDG`;
}
