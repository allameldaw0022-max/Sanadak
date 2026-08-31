import { ImageIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export function Screenshot({
  color,
  index,
  className,
}: {
  color: string;
  index: number;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex aspect-[9/16] w-36 shrink-0 flex-col items-center justify-center gap-2 rounded-2xl border border-slate-200 shadow-sm sm:w-44",
        className
      )}
      style={{ backgroundColor: `${color}14` }}
    >
      <ImageIcon className="h-8 w-8" style={{ color }} strokeWidth={1.5} />
      <span className="text-xs font-medium text-slate-400">لقطة {index}</span>
    </div>
  );
}
