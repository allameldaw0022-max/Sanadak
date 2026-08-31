"use client";

import { useState, useTransition, type FormEvent } from "react";
import { AlertCircle, CheckCircle2, Save } from "lucide-react";
import { updatePaymentSettingsAction } from "@/app/admin/settings/payment/actions";
import type { PaymentSettings } from "@/lib/supabase/queries";

function Field({
  label,
  name,
  defaultValue,
  type = "text",
  required,
  step,
  hint,
}: {
  label: string;
  name: string;
  defaultValue: string | number;
  type?: string;
  required?: boolean;
  step?: string;
  hint?: string;
}) {
  return (
    <div>
      <label htmlFor={name} className="mb-1.5 block text-sm font-semibold text-navy">
        {label}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        step={step}
        required={required}
        defaultValue={defaultValue}
        className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none transition-colors focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/20"
      />
      {hint && <p className="mt-1 text-xs text-slate-400">{hint}</p>}
    </div>
  );
}

export function PaymentSettingsForm({ settings }: { settings: PaymentSettings }) {
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [pending, startTransition] = useTransition();

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSaved(false);
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      try {
        await updatePaymentSettingsAction(formData);
        setSaved(true);
      } catch (err) {
        setError(err instanceof Error ? err.message : "تعذر حفظ الإعدادات.");
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <h2 className="mb-4 text-base font-bold text-navy">بيانات الحساب البنكي</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="اسم البنك" name="bankName" defaultValue={settings.bankName} />
          <Field label="اسم صاحب الحساب" name="accountHolderName" defaultValue={settings.accountHolderName} />
          <Field label="رقم الحساب" name="accountNumber" defaultValue={settings.accountNumber} />
          <Field label="IBAN (اختياري)" name="iban" defaultValue={settings.iban} />
          <Field label="رقم الهاتف (اختياري)" name="phone" defaultValue={settings.phone} />
          <Field label="اسم وسيلة الدفع" name="paymentMethodName" defaultValue={settings.paymentMethodName} />
        </div>
        <div className="mt-4">
          <label htmlFor="paymentInstructions" className="mb-1.5 block text-sm font-semibold text-navy">
            تعليمات الدفع
          </label>
          <textarea
            id="paymentInstructions"
            name="paymentInstructions"
            rows={3}
            defaultValue={settings.paymentInstructions}
            className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none transition-colors focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/20"
          />
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <h2 className="mb-4 text-base font-bold text-navy">سعر الصرف وأسعار الخطط</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Field
            label="سعر الصرف (1 USD = ? SDG)"
            name="usdToSdgRate"
            type="number"
            step="0.01"
            required
            defaultValue={settings.usdToSdgRate}
            hint="طلبات الدفع القديمة لا تتأثر بتغيير هذا السعر."
          />
          <Field
            label="سعر الخطة الأساسية ($/سنة)"
            name="basicPriceUsd"
            type="number"
            step="0.01"
            required
            defaultValue={settings.basicPriceUsd}
          />
          <Field
            label="سعر الخطة الاحترافية ($/سنة)"
            name="proPriceUsd"
            type="number"
            step="0.01"
            required
            defaultValue={settings.proPriceUsd}
          />
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <h2 className="mb-4 text-base font-bold text-navy">حدود الخطط والعرض المجاني</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Field
            label="الحد الأقصى لتطبيقات الأساسية"
            name="basicMaxApps"
            type="number"
            required
            defaultValue={settings.basicMaxApps}
          />
          <Field
            label="عدد المطورين المؤهلين للعرض"
            name="freeTrialMaxDevelopers"
            type="number"
            required
            defaultValue={settings.freeTrialMaxDevelopers}
          />
          <Field
            label="مدة الفترة المجانية (يوم)"
            name="freeTrialDays"
            type="number"
            required
            defaultValue={settings.freeTrialDays}
          />
          <Field
            label="فترة السماح بعد الانتهاء (يوم)"
            name="gracePeriodDays"
            type="number"
            required
            defaultValue={settings.gracePeriodDays}
          />
        </div>
      </div>

      {error && (
        <p className="flex items-center gap-1.5 text-xs font-medium text-red-600">
          <AlertCircle className="h-3.5 w-3.5" />
          {error}
        </p>
      )}
      {saved && (
        <p className="flex items-center gap-1.5 text-xs font-medium text-primary-dark">
          <CheckCircle2 className="h-3.5 w-3.5" />
          تم حفظ الإعدادات بنجاح.
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="flex h-12 items-center gap-2 rounded-xl bg-primary px-8 text-sm font-bold text-white transition-colors hover:bg-primary-dark disabled:opacity-60"
      >
        <Save className="h-4 w-4" />
        {pending ? "جارٍ الحفظ..." : "حفظ الإعدادات"}
      </button>
    </form>
  );
}
