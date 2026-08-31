import { Check, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatUsd } from "@/lib/subscription";

export function PlanCard({
  plan,
  priceUsd,
  limitLabel,
  features,
  highlighted,
  isCurrent,
  onSelect,
  disabled,
}: {
  plan: "basic" | "pro";
  priceUsd: number;
  limitLabel: string;
  features: string[];
  highlighted?: boolean;
  isCurrent?: boolean;
  onSelect: () => void;
  disabled?: boolean;
}) {
  const title = plan === "basic" ? "الخطة الأساسية" : "الخطة الاحترافية";

  return (
    <div
      className={cn(
        "relative flex flex-col rounded-2xl border bg-white p-5 shadow-sm sm:p-6",
        highlighted ? "border-primary ring-1 ring-primary/30" : "border-slate-200"
      )}
    >
      {highlighted && (
        <span className="absolute -top-3 right-5 flex items-center gap-1 rounded-full bg-primary px-3 py-1 text-[11px] font-bold text-white">
          <Sparkles className="h-3 w-3" />
          الأكثر قيمة
        </span>
      )}

      <h3 className="text-base font-extrabold text-navy">{title}</h3>
      <p className="mt-2">
        <span className="text-2xl font-extrabold text-navy">{formatUsd(priceUsd)}</span>
        <span className="text-sm text-slate-500"> / سنة</span>
      </p>
      <p className="mt-1 text-sm font-semibold text-primary-dark">{limitLabel}</p>

      <ul className="mt-4 flex-1 space-y-2">
        {features.map((f) => (
          <li key={f} className="flex items-start gap-2 text-sm text-slate-600">
            <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
            {f}
          </li>
        ))}
      </ul>

      <button
        type="button"
        onClick={onSelect}
        disabled={disabled || isCurrent}
        className={cn(
          "mt-5 flex h-11 w-full items-center justify-center rounded-xl text-sm font-bold transition-colors disabled:cursor-not-allowed disabled:opacity-60",
          highlighted
            ? "bg-primary text-white hover:bg-primary-dark"
            : "border border-navy text-navy hover:bg-navy hover:text-white"
        )}
      >
        {isCurrent ? "خطتك الحالية" : "اختيار الخطة"}
      </button>
    </div>
  );
}
