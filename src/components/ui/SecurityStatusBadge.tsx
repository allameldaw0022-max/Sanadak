import { cn } from "@/lib/utils";

const securityStatusLabels: Record<string, string> = {
  pending_scan: "بانتظار الفحص",
  scanning: "جارٍ الفحص",
  passed: "اجتاز الفحص الأمني",
  review_required: "يحتاج مراجعة أمنية",
  failed: "لم يجتز الفحص الأمني",
};

const securityStatusStyles: Record<string, string> = {
  pending_scan: "bg-slate-100 text-slate-600",
  scanning: "bg-amber-50 text-amber-700",
  passed: "bg-primary-light text-primary-dark",
  review_required: "bg-orange-50 text-orange-700",
  failed: "bg-red-50 text-red-600",
};

export function SecurityStatusBadge({ status }: { status: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold",
        securityStatusStyles[status] ?? "bg-slate-100 text-slate-600"
      )}
    >
      {securityStatusLabels[status] ?? status}
    </span>
  );
}

const riskLevelLabels: Record<string, string> = { low: "منخفض", medium: "متوسط", high: "مرتفع", critical: "حرج" };
const riskLevelStyles: Record<string, string> = {
  low: "bg-primary-light text-primary-dark",
  medium: "bg-amber-50 text-amber-700",
  high: "bg-orange-50 text-orange-700",
  critical: "bg-red-50 text-red-600",
};

export function RiskLevelBadge({ level }: { level: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold",
        riskLevelStyles[level] ?? "bg-slate-100 text-slate-600"
      )}
    >
      خطورة: {riskLevelLabels[level] ?? level}
    </span>
  );
}
