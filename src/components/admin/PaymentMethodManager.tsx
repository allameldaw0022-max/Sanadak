"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Pencil } from "lucide-react";
import { upsertPaymentMethodAction, setPaymentMethodActiveAction } from "@/app/admin/subscriptions/actions";
import type { AdminPaymentMethodItem } from "@/lib/supabase/queries";
import { cn } from "@/lib/utils";

type FormState = {
  id?: string;
  bankName: string;
  accountHolderName: string;
  accountNumber: string;
  iban: string;
  phoneOrWallet: string;
  instructions: string;
};

const emptyForm: FormState = {
  bankName: "",
  accountHolderName: "",
  accountNumber: "",
  iban: "",
  phoneOrWallet: "",
  instructions: "",
};

export function PaymentMethodManager({ methods }: { methods: AdminPaymentMethodItem[] }) {
  const router = useRouter();
  const [form, setForm] = useState<FormState>(emptyForm);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function edit(m: AdminPaymentMethodItem) {
    setForm({
      id: m.id,
      bankName: m.bankName,
      accountHolderName: m.accountHolderName,
      accountNumber: m.accountNumber,
      iban: m.iban ?? "",
      phoneOrWallet: m.phoneOrWallet ?? "",
      instructions: m.instructions ?? "",
    });
    setError(null);
  }

  function save() {
    if (!form.bankName.trim() || !form.accountHolderName.trim() || !form.accountNumber.trim()) {
      setError("تحقق من صحة البيانات المدخلة.");
      return;
    }
    setError(null);
    startTransition(async () => {
      const result = await upsertPaymentMethodAction(form);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setForm(emptyForm);
      router.refresh();
    });
  }

  function toggleActive(m: AdminPaymentMethodItem) {
    startTransition(async () => {
      await setPaymentMethodActiveAction(m.id, !m.isActive);
      router.refresh();
    });
  }

  return (
    <div>
      <div className="mb-8 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="mb-4 text-sm font-extrabold text-navy">{form.id ? "تعديل وسيلة دفع" : "إضافة وسيلة دفع جديدة"}</h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <label className="block">
            <span className="mb-1 block text-xs font-semibold text-slate-500">اسم البنك</span>
            <input
              value={form.bankName}
              onChange={(e) => setForm({ ...form, bankName: e.target.value })}
              className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm focus:border-primary focus:outline-none"
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-semibold text-slate-500">اسم صاحب الحساب</span>
            <input
              value={form.accountHolderName}
              onChange={(e) => setForm({ ...form, accountHolderName: e.target.value })}
              className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm focus:border-primary focus:outline-none"
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-semibold text-slate-500">رقم الحساب</span>
            <input
              value={form.accountNumber}
              onChange={(e) => setForm({ ...form, accountNumber: e.target.value })}
              dir="ltr"
              className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm focus:border-primary focus:outline-none"
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-semibold text-slate-500">IBAN (اختياري)</span>
            <input
              value={form.iban}
              onChange={(e) => setForm({ ...form, iban: e.target.value })}
              dir="ltr"
              className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm focus:border-primary focus:outline-none"
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-semibold text-slate-500">هاتف/محفظة (اختياري)</span>
            <input
              value={form.phoneOrWallet}
              onChange={(e) => setForm({ ...form, phoneOrWallet: e.target.value })}
              dir="ltr"
              className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm focus:border-primary focus:outline-none"
            />
          </label>
          <label className="block sm:col-span-2">
            <span className="mb-1 block text-xs font-semibold text-slate-500">تعليمات الدفع (اختياري)</span>
            <textarea
              value={form.instructions}
              onChange={(e) => setForm({ ...form, instructions: e.target.value })}
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
            {form.id ? "حفظ التعديلات" : "إضافة وسيلة الدفع"}
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
                <th className="px-5 py-3 font-semibold">البنك</th>
                <th className="px-5 py-3 font-semibold">صاحب الحساب</th>
                <th className="px-5 py-3 font-semibold">رقم الحساب</th>
                <th className="px-5 py-3 font-semibold">الحالة</th>
                <th className="px-5 py-3 font-semibold">الإجراء</th>
              </tr>
            </thead>
            <tbody>
              {methods.map((m) => (
                <tr key={m.id} className="border-b border-slate-50 last:border-0">
                  <td className="px-5 py-3 font-semibold text-navy">{m.bankName}</td>
                  <td className="px-5 py-3 text-slate-600">{m.accountHolderName}</td>
                  <td className="px-5 py-3 text-slate-600" dir="ltr">
                    {m.accountNumber}
                  </td>
                  <td className="px-5 py-3">
                    <span
                      className={cn(
                        "rounded-full px-2.5 py-1 text-xs font-semibold",
                        m.isActive ? "bg-primary-light text-primary-dark" : "bg-slate-100 text-slate-500"
                      )}
                    >
                      {m.isActive ? "مفعّلة" : "معطّلة"}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => edit(m)}
                        className="flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-200"
                      >
                        <Pencil className="h-3 w-3" />
                        تعديل
                      </button>
                      <button
                        type="button"
                        onClick={() => toggleActive(m)}
                        className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-200"
                      >
                        {m.isActive ? "تعطيل" : "تفعيل"}
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
