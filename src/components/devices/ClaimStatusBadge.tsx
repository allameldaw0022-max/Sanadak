import { cn } from "@/lib/utils";

const claimStatusLabels: Record<string, string> = {
  SUBMITTED: "قُدّمت",
  UNDER_REVIEW: "قيد المراجعة",
  MORE_INFORMATION_REQUIRED: "يلزم مزيد من المعلومات",
  APPROVED: "تمت الموافقة",
  REJECTED: "مرفوضة",
};

const claimStatusStyles: Record<string, string> = {
  SUBMITTED: "bg-slate-100 text-slate-600",
  UNDER_REVIEW: "bg-amber-50 text-amber-700",
  MORE_INFORMATION_REQUIRED: "bg-orange-50 text-orange-700",
  APPROVED: "bg-primary-light text-primary-dark",
  REJECTED: "bg-red-50 text-red-600",
};

export function ClaimStatusBadge({ status }: { status: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold",
        claimStatusStyles[status] ?? "bg-slate-100 text-slate-600"
      )}
    >
      {claimStatusLabels[status] ?? status}
    </span>
  );
}
