import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export function StatsCard({
  label,
  value,
  icon: Icon,
  color = "#16A34A",
  className,
}: {
  label: string;
  value: string | number;
  icon: LucideIcon;
  color?: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm",
        className
      )}
    >
      <div
        className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl"
        style={{ backgroundColor: `${color}1A`, color }}
      >
        <Icon className="h-6 w-6" />
      </div>
      <div className="min-w-0">
        <p className="text-2xl font-extrabold text-navy">{value}</p>
        <p className="truncate text-xs text-slate-500">{label}</p>
      </div>
    </div>
  );
}
