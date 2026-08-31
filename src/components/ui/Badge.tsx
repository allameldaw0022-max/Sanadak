import { cn } from "@/lib/utils";
import type { AppStatus } from "@/data/types";
import { getStatusLabel } from "@/lib/utils";

const statusStyles: Record<AppStatus, string> = {
  approved: "bg-primary-light text-primary-dark",
  pending: "bg-amber-50 text-amber-700",
  rejected: "bg-red-50 text-red-600",
};

export function StatusBadge({ status }: { status: AppStatus }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold",
        statusStyles[status]
      )}
    >
      {getStatusLabel(status)}
    </span>
  );
}
