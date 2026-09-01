import { cn } from "@/lib/utils";

const statusLabels: Record<string, string> = {
  pending: "قيد المراجعة",
  approved: "مقبول",
  rejected: "مرفوض",
  cancelled: "ملغى",
};

const statusStyles: Record<string, string> = {
  pending: "bg-amber-50 text-amber-700",
  approved: "bg-primary-light text-primary-dark",
  rejected: "bg-red-50 text-red-600",
  cancelled: "bg-slate-100 text-slate-500",
};

export function SubscriptionRequestStatusBadge({ status }: { status: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold",
        statusStyles[status] ?? "bg-slate-100 text-slate-600"
      )}
    >
      {statusLabels[status] ?? status}
    </span>
  );
}
