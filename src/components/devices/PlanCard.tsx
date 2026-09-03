import { Check, Smartphone, Star } from "lucide-react";
import { cn } from "@/lib/utils";
import type { SubscriptionPlanItem } from "@/lib/supabase/queries";

export function PlanCard({
  plan,
  selected,
  isCurrentPlan,
  onSelect,
  ctaLabel,
}: {
  plan: SubscriptionPlanItem;
  selected: boolean;
  isCurrentPlan: boolean;
  onSelect: () => void;
  // Optional override for the not-selected/not-current button label -- e.g.
  // "الترقية إلى ..." when the dealer already has an active subscription on
  // a lower-tier plan. Falls back to the existing "اشترك الآن" wording.
  // Selecting the plan still always shows "الخطة المختارة" regardless.
  ctaLabel?: string;
}) {
  return (
    <div
      className={cn(
        "relative flex flex-col rounded-2xl border-2 bg-white p-5 text-right transition-colors",
        plan.isPopular ? "border-primary shadow-md" : selected ? "border-primary" : "border-slate-200",
        !plan.isPopular && selected && "bg-primary-light/20"
      )}
    >
      {plan.isPopular && (
        <span className="absolute -top-3 right-5 inline-flex items-center gap-1 rounded-full bg-primary px-3 py-1 text-[11px] font-bold text-white">
          <Star className="h-3 w-3 fill-current" />
          الأكثر اختيارًا
        </span>
      )}

      <p className="text-base font-extrabold text-navy">{plan.name}</p>
      {plan.description && <p className="mt-1 text-xs text-slate-500">{plan.description}</p>}

      <div className="mt-4" dir="ltr">
        <span className="text-3xl font-extrabold text-navy">{plan.monthlyPriceSdg.toLocaleString("ar-SD")}</span>
        <span className="mr-1 text-xs font-semibold text-slate-500">جنيه سوداني / شهريًا</span>
      </div>

      <div className="mt-3 flex items-center gap-1.5 text-xs font-semibold text-slate-600">
        <Smartphone className="h-3.5 w-3.5" />
        حتى {plan.maxDevices} جهاز
      </div>

      {plan.features.length > 0 && (
        <ul className="mt-4 space-y-2">
          {plan.features.map((feature, i) => (
            <li key={i} className="flex items-start gap-2 text-xs text-slate-600">
              <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
              {feature}
            </li>
          ))}
        </ul>
      )}

      <div className="mt-5">
        {isCurrentPlan ? (
          <span className="flex h-11 w-full items-center justify-center rounded-xl bg-slate-100 text-sm font-bold text-slate-500">
            باقتك الحالية
          </span>
        ) : (
          <button
            type="button"
            onClick={onSelect}
            className={cn(
              "flex h-11 w-full items-center justify-center rounded-xl text-sm font-bold transition-colors",
              selected ? "bg-primary text-white hover:bg-primary-dark" : "bg-primary-light text-primary-dark hover:bg-primary/20"
            )}
          >
            {selected ? "الخطة المختارة" : (ctaLabel ?? "اشترك الآن")}
          </button>
        )}
      </div>
    </div>
  );
}
