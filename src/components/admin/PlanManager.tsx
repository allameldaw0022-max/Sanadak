"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Pencil } from "lucide-react";
import { upsertSubscriptionPlanAction, setSubscriptionPlanActiveAction } from "@/app/admin/subscriptions/actions";
import type { AdminSubscriptionPlanItem } from "@/lib/supabase/queries";
import { cn } from "@/lib/utils";

type FormState = {
  id?: string;
  name: string;
  monthlyPriceSdg: string;
  maxDevices: string;
  description: string;
  sortOrder: string;
};

const emptyForm: FormState = { name: "", monthlyPriceSdg: "", maxDevices: "", description: "", sortOrder: "0" };

export function PlanManager({ plans }: { plans: AdminSubscriptionPlanItem[] }) {
  const router = useRouter();
  const [form, setForm] = useState<FormState>(emptyForm);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function edit(plan: AdminSubscriptionPlanItem) {
    setForm({
      id: plan.id,
      name: plan.name,
      monthlyPriceSdg: String(plan.monthlyPriceSdg),
      maxDevices: String(plan.maxDevices),
      description: plan.description ?? "",
      sortOrder: String(plan.sortOrder),
    });
    setError(null);
  }

  function save() {
    const monthlyPriceSdg = Number(form.monthlyPriceSdg);
    const maxDevices = Number(form.maxDevices);
    const sortOrder = Number(form.sortOrder) || 0;
    if (!form.name.trim() || !Number.isFinite(monthlyPriceSdg) || !Number.isFinite(maxDevices)) {
      setError("تحقق من صحة البيانات المدخلة.");
      return;
    }
    setError(null);
    startTransition(async () => {
      const result = await upsertSubscriptionPlanAction({
        id: form.id,
        name: form.name,
        monthlyPriceSdg,
        maxDevices,
        description: form.description,
        sortOrder,
      });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setForm(emptyForm);
      router.refresh();
    });
  }

  function toggleActive(plan: AdminSubscriptionPlanItem) {
    startTransition(async () => {
      await setSubscriptionPlanActiveAction(plan.id, !plan.isActive);
      router.refresh();
    });
  }

  return (
    <div>
      <div className="mb-8 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="mb-4 text-sm font-extrabold text-navy">{form.id ? "تعديل خطة" : "إضافة خطة جديدة"}</h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <label className="block">
            <span className="mb-1 block text-xs font-semibold text-slate-500">اسم الخطة</span>
            <input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm focus:border-primary focus:outline-none"
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-semibold text-slate-500">السعر الشهري (SDG)</span>
            <input
              type="number"
              min={0}
              value={form.monthlyPriceSdg}
              onChange={(e) => setForm({ ...form, monthlyPriceSdg: e.target.value })}
              dir="ltr"
              className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm focus:border-primary focus:outline-none"
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-semibold text-slate-500">الحد الأقصى للأجهزة</span>
            <input
              type="number"
              min={1}
              value={form.maxDevices}
              onChange={(e) => setForm({ ...form, maxDevices: e.target.value })}
              dir="ltr"
              className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm focus:border-primary focus:outline-none"
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-semibold text-slate-500">ترتيب العرض</span>
            <input
              type="number"
              value={form.sortOrder}
              onChange={(e) => setForm({ ...form, sortOrder: e.target.value })}
              dir="ltr"
              className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm focus:border-primary focus:outline-none"
            />
          </label>
          <label className="block sm:col-span-2">
            <span className="mb-1 block text-xs font-semibold text-slate-500">الوصف/المزايا</span>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={2}
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-primary focus:outline-none"
            />
          </label>
        </div>
        {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
        <div className="mt-4 flex gap-2">
          <button
            type="button"
            onClick={save}
            disabled={pending}
            className="h-11 rounded-xl bg-primary px-6 text-sm font-bold text-white hover:bg-primary-dark disabled:opacity-60"
          >
            {form.id ? "حفظ التعديلات" : "إضافة الخطة"}
          </button>
          {form.id && (
            <button
              type="button"
              onClick={() => setForm(emptyForm)}
              className="h-11 rounded-xl border border-slate-200 px-6 text-sm font-bold text-navy hover:bg-slate-50"
            >
              إلغاء
            </button>
          )}
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-right text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50 text-xs text-slate-500">
                <th className="px-5 py-3 font-semibold">الاسم</th>
                <th className="px-5 py-3 font-semibold">السعر</th>
                <th className="px-5 py-3 font-semibold">الحد الأقصى</th>
                <th className="px-5 py-3 font-semibold">الحالة</th>
                <th className="px-5 py-3 font-semibold">الإجراء</th>
              </tr>
            </thead>
            <tbody>
              {plans.map((plan) => (
                <tr key={plan.id} className="border-b border-slate-50 last:border-0">
                  <td className="px-5 py-3 font-semibold text-navy">{plan.name}</td>
                  <td className="px-5 py-3 text-slate-600" dir="ltr">
                    {plan.monthlyPriceSdg.toLocaleString("ar-SD")} SDG
                  </td>
                  <td className="px-5 py-3 text-slate-600" dir="ltr">
                    {plan.maxDevices}
                  </td>
                  <td className="px-5 py-3">
                    <span
                      className={cn(
                        "rounded-full px-2.5 py-1 text-xs font-semibold",
                        plan.isActive ? "bg-primary-light text-primary-dark" : "bg-slate-100 text-slate-500"
                      )}
                    >
                      {plan.isActive ? "مفعّلة" : "معطّلة"}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => edit(plan)}
                        className="flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-200"
                      >
                        <Pencil className="h-3 w-3" />
                        تعديل
                      </button>
                      <button
                        type="button"
                        onClick={() => toggleActive(plan)}
                        className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-200"
                      >
                        {plan.isActive ? "تعطيل" : "تفعيل"}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
