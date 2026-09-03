"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Plus, Trash2, Star } from "lucide-react";
import { upsertSubscriptionPlanAction, setSubscriptionPlanActiveAction } from "@/app/admin/subscriptions/actions";
import type { AdminSubscriptionPlanItem } from "@/lib/supabase/queries";
import { cn } from "@/lib/utils";

type FormState = {
  id?: string;
  name: string;
  slug: string;
  monthlyPriceSdg: string;
  maxDevices: string;
  description: string;
  features: string[];
  isPopular: boolean;
  sortOrder: string;
};

const emptyForm: FormState = {
  name: "",
  slug: "",
  monthlyPriceSdg: "",
  maxDevices: "",
  description: "",
  features: [],
  isPopular: false,
  sortOrder: "0",
};

// Same transformation the server action applies to the slug before
// validating/saving it -- used here only to pre-fill a sensible default so
// the admin isn't forced to type one by hand; the server action re-derives
// and re-validates it independently regardless of what's submitted.
function slugify(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export function PlanManager({ plans }: { plans: AdminSubscriptionPlanItem[] }) {
  const router = useRouter();
  const [form, setForm] = useState<FormState>(emptyForm);
  const [slugTouched, setSlugTouched] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function edit(plan: AdminSubscriptionPlanItem) {
    setForm({
      id: plan.id,
      name: plan.name,
      slug: plan.slug,
      monthlyPriceSdg: String(plan.monthlyPriceSdg),
      maxDevices: String(plan.maxDevices),
      description: plan.description ?? "",
      features: plan.features,
      isPopular: plan.isPopular,
      sortOrder: String(plan.sortOrder),
    });
    setSlugTouched(true);
    setError(null);
  }

  function resetForm() {
    setForm(emptyForm);
    setSlugTouched(false);
    setError(null);
  }

  function onNameChange(name: string) {
    setForm((f) => ({ ...f, name, slug: slugTouched ? f.slug : slugify(name) }));
  }

  function updateFeature(index: number, value: string) {
    setForm((f) => ({ ...f, features: f.features.map((feat, i) => (i === index ? value : feat)) }));
  }

  function addFeature() {
    setForm((f) => ({ ...f, features: [...f.features, ""] }));
  }

  function removeFeature(index: number) {
    setForm((f) => ({ ...f, features: f.features.filter((_, i) => i !== index) }));
  }

  function save() {
    const monthlyPriceSdg = Number(form.monthlyPriceSdg);
    const maxDevices = Number(form.maxDevices);
    const sortOrder = Number(form.sortOrder) || 0;
    if (!form.name.trim() || !form.slug.trim()) {
      setError("اسم الخطة والمعرف (slug) مطلوبان.");
      return;
    }
    if (!Number.isFinite(monthlyPriceSdg) || monthlyPriceSdg < 0) {
      setError("السعر يجب أن يكون رقمًا صحيحًا وغير سالب.");
      return;
    }
    if (!Number.isInteger(maxDevices) || maxDevices < 1) {
      setError("الحد الأقصى للأجهزة يجب أن يكون 1 على الأقل.");
      return;
    }
    setError(null);
    startTransition(async () => {
      const result = await upsertSubscriptionPlanAction({
        id: form.id,
        name: form.name,
        slug: form.slug,
        monthlyPriceSdg,
        maxDevices,
        description: form.description,
        features: form.features,
        isPopular: form.isPopular,
        sortOrder,
      });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      resetForm();
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
              onChange={(e) => onNameChange(e.target.value)}
              className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm focus:border-primary focus:outline-none"
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-semibold text-slate-500">المعرف (slug)</span>
            <input
              value={form.slug}
              onChange={(e) => {
                setSlugTouched(true);
                setForm({ ...form, slug: e.target.value });
              }}
              dir="ltr"
              placeholder="basic"
              className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm focus:border-primary focus:outline-none"
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-semibold text-slate-500">السعر الشهري (جنيه سوداني)</span>
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
          <label className="flex items-center gap-2 self-end pb-1">
            <input
              type="checkbox"
              checked={form.isPopular}
              onChange={(e) => setForm({ ...form, isPopular: e.target.checked })}
              className="h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary"
            />
            <span className="text-xs font-semibold text-slate-600">تحديدها كـ&quot;الأكثر اختيارًا&quot;</span>
          </label>
          <label className="block sm:col-span-2">
            <span className="mb-1 block text-xs font-semibold text-slate-500">وصف قصير</span>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={2}
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-primary focus:outline-none"
            />
          </label>
          <div className="sm:col-span-2">
            <span className="mb-1 block text-xs font-semibold text-slate-500">المزايا</span>
            <div className="space-y-2">
              {form.features.map((feature, i) => (
                <div key={i} className="flex items-center gap-2">
                  <input
                    value={feature}
                    onChange={(e) => updateFeature(i, e.target.value)}
                    placeholder="مثال: توثيق الأجهزة"
                    className="h-10 flex-1 rounded-xl border border-slate-200 px-3 text-sm focus:border-primary focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => removeFeature(i)}
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-50 text-red-500 hover:bg-red-100"
                    aria-label="حذف الميزة"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={addFeature}
                className="flex items-center gap-1.5 rounded-xl border border-dashed border-slate-300 px-3 py-2 text-xs font-semibold text-slate-500 hover:border-primary hover:text-primary"
              >
                <Plus className="h-3.5 w-3.5" />
                إضافة ميزة
              </button>
            </div>
          </div>
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
              onClick={resetForm}
              className="h-11 rounded-xl border border-slate-200 px-6 text-sm font-bold text-navy hover:bg-slate-50"
            >
              إلغاء
            </button>
          )}
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-right text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50 text-xs text-slate-500">
                <th className="px-5 py-3 font-semibold">اسم الخطة</th>
                <th className="px-5 py-3 font-semibold">السعر</th>
                <th className="px-5 py-3 font-semibold">الأجهزة</th>
                <th className="px-5 py-3 font-semibold">الحالة</th>
                <th className="px-5 py-3 font-semibold">الأكثر اختيارًا</th>
                <th className="px-5 py-3 font-semibold">الإجراءات</th>
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
                    {plan.isPopular && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-600">
                        <Star className="h-3 w-3 fill-current" />
                        نعم
                      </span>
                    )}
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
