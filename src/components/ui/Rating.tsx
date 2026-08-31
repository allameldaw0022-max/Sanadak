import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

export function Rating({
  value,
  count,
  size = "sm",
  className,
}: {
  value: number;
  count?: number;
  size?: "sm" | "md";
  className?: string;
}) {
  const iconSize = size === "md" ? "h-4 w-4" : "h-3.5 w-3.5";
  return (
    <div className={cn("flex items-center gap-1", className)}>
      <Star className={cn(iconSize, "fill-amber-400 text-amber-400")} />
      <span className={cn("font-semibold text-navy", size === "md" ? "text-sm" : "text-xs")}>
        {value.toFixed(1)}
      </span>
      {count !== undefined && (
        <span className="text-xs text-slate-500">
          ({count >= 1000 ? `${(count / 1000).toFixed(1)}K` : count})
        </span>
      )}
    </div>
  );
}
