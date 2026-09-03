"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, UploadCloud, CheckCircle2 } from "lucide-react";
import { submitSubscriptionRequestAction } from "@/app/dealer/subscription/actions";
import { cn } from "@/lib/utils";
import { PlanCard } from "./PlanCard";
import type { SubscriptionPlanItem, PaymentMethodItem } from "@/lib/supabase/queries";

const IMAGE_TYPES = ["image/png", "image/jpeg", "image/webp"];
const MAX_SIZE = 5 * 1024 * 1024;

function quickCheck(file: File): string | null {
  if (!IMAGE_TYPES.includes(file.type)) return "صورة إثبات الدفع يجب أن تكون PNG أو JPG أو WebP.";
  if (file.size > MAX_SIZE) return "حجم الصورة يجب ألا يتجاوز 5 ميجابايت.";
  return null;
}

export function SubscriptionRequestForm({
  plans,
  paymentMethods,
  currentPlanId,
}: {
  plans: SubscriptionPlanItem[];
  paymentMethods: PaymentMethodItem[];
  currentPlanId?: string | null;
}) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [planId, setPlanId] = useState<string | null>(plans[0]?.id ?? null);
  const [paymentMethodId, setPaymentMethodId] = useState<string | null>(paymentMethods[0]?.id ?? null);
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const selectedMethod = paymentMethods.find((m) => m.id === paymentMethodId);

  function handleFile(f: File) {
    const quickError = quickCheck(f);
    if (quickError) {
      setError(quickError);
      return;
    }
    setError(null);
    setFile(f);
  }

  function handleSubmit() {
    if (!planId || !paymentMethodId || !file) {
      setError("اختر خطة ووسيلة دفع، وأرفق صورة إثبات الدفع.");
      return;
    }
    setError(null);
    startTransition(async () => {
      const result = await submitSubscriptionRequestAction(planId, paymentMethodId, file);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      router.refresh();
    });
  }

  if (plans.length === 0) {
    return <p className="text-sm text-slate-500">لا توجد خطط اشتراك متاحة حاليًا.</p>;
  }

  return (
    <div className="space-y-5">
      <div>
        <h3 className="text-lg font-extrabold text-navy">اختر الباقة المناسبة لنشاطك</h3>
        <p className="mt-1 mb-4 text-sm text-slate-500">ابدأ بإدارة أجهزتك وتوثيقها بسهولة مع سندك.</p>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {plans.map((plan) => (
            <PlanCard
              key={plan.id}
              plan={plan}
              selected={planId === plan.id}
              isCurrentPlan={currentPlanId === plan.id}
              onSelect={() => setPlanId(plan.id)}
            />
          ))}
        </div>
      </div>

      <div>
        <p className="mb-2 text-sm font-bold text-navy">اختر وسيلة الدفع</p>
        {paymentMethods.length === 0 ? (
          <p className="text-sm text-slate-500">لا توجد وسيلة دفع متاحة حاليًا، تواصل مع الدعم.</p>
        ) : (
          <div className="space-y-2">
            {paymentMethods.map((method) => (
              <button
                key={method.id}
                type="button"
                onClick={() => setPaymentMethodId(method.id)}
                className={cn(
                  "w-full rounded-2xl border p-4 text-right transition-colors",
                  paymentMethodId === method.id
                    ? "border-primary bg-primary-light/40"
                    : "border-slate-200 bg-white hover:bg-slate-50"
                )}
              >
                <p className="text-sm font-bold text-navy">{method.bankName}</p>
                <p className="mt-1 text-xs text-slate-500">
                  {method.accountHolderName} — <span dir="ltr">{method.accountNumber}</span>
                </p>
                {method.iban && (
                  <p className="mt-0.5 text-xs text-slate-500" dir="ltr">
                    IBAN: {method.iban}
                  </p>
                )}
              </button>
            ))}
          </div>
        )}
        {selectedMethod && (selectedMethod.phoneOrWallet || selectedMethod.instructions) && (
          <div className="mt-2 rounded-xl bg-slate-50 p-3 text-xs text-slate-600">
            {selectedMethod.phoneOrWallet && <p dir="ltr">هاتف/محفظة: {selectedMethod.phoneOrWallet}</p>}
            {selectedMethod.instructions && <p className="mt-1">{selectedMethod.instructions}</p>}
          </div>
        )}
      </div>

      <div>
        <p className="mb-2 text-sm font-bold text-navy">أرفق إثبات الدفع</p>
        <input
          ref={inputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) handleFile(f);
            e.target.value = "";
          }}
        />
        <div
          onClick={() => inputRef.current?.click()}
          className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-center transition-colors hover:bg-slate-100"
        >
          {file ? (
            <>
              <CheckCircle2 className="h-6 w-6 text-primary" />
              <p className="text-xs font-semibold text-navy">{file.name}</p>
            </>
          ) : (
            <>
              <UploadCloud className="h-6 w-6 text-slate-400" />
              <p className="text-xs font-semibold text-slate-500">اضغط لاختيار صورة إيصال التحويل</p>
            </>
          )}
        </div>
      </div>

      {error && (
        <p className="flex items-center gap-1.5 text-xs font-medium text-red-600">
          <AlertCircle className="h-3.5 w-3.5 shrink-0" />
          {error}
        </p>
      )}

      <button
        type="button"
        onClick={handleSubmit}
        disabled={pending}
        className="flex h-12 w-full items-center justify-center rounded-xl bg-primary text-sm font-bold text-white transition-colors hover:bg-primary-dark disabled:opacity-60"
      >
        {pending ? "جارٍ الإرسال..." : "إرسال طلب الاشتراك"}
      </button>
    </div>
  );
}
