import { cn } from "@/lib/utils";

const reportStatusLabels: Record<string, string> = {
  SUBMITTED: "قُدّم",
  UNDER_REVIEW: "قيد المراجعة",
  APPROVED: "تمت الموافقة",
  REJECTED: "مرفوض",
};

const reportStatusStyles: Record<string, string> = {
  SUBMITTED: "bg-slate-100 text-slate-600",
  UNDER_REVIEW: "bg-amber-50 text-amber-700",
  APPROVED: "bg-primary-light text-primary-dark",
  REJECTED: "bg-red-50 text-red-600",
};

export function ReportStatusBadge({ status }: { status: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold",
        reportStatusStyles[status] ?? "bg-slate-100 text-slate-600"
      )}
    >
      {reportStatusLabels[status] ?? status}
    </span>
  );
}
