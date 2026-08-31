"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { UploadCloud, Send, CheckCircle2, ArrowLeft } from "lucide-react";
import { categories } from "@/data/categories";

function UploadZone({ label, hint }: { label: string; hint: string }) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-semibold text-navy">{label}</label>
      <div className="flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center transition-colors hover:border-primary/40">
        <UploadCloud className="h-7 w-7 text-slate-400" />
        <p className="text-xs text-slate-500">{hint}</p>
        <span className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-500">
          اختر ملفًا
        </span>
      </div>
    </div>
  );
}

export default function AddAppPage() {
  const [submitted, setSubmitted] = useState(false);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitted(true);
  }

  if (submitted) {
    return (
      <div className="mx-auto flex max-w-lg flex-col items-center gap-3 rounded-2xl border border-slate-200 bg-white py-16 text-center shadow-sm">
        <CheckCircle2 className="h-12 w-12 text-primary" />
        <h1 className="text-lg font-extrabold text-navy">تم إرسال تطبيقك للمراجعة</h1>
        <p className="max-w-sm text-sm text-slate-500">
          سيقوم فريق سندك بمراجعة تطبيقك، وسيظهر ضمن قائمة &quot;قيد المراجعة&quot; حتى تتم الموافقة عليه.
        </p>
        <Link
          href="/developer/dashboard"
          className="mt-3 flex h-11 items-center gap-2 rounded-xl bg-primary px-6 text-sm font-bold text-white hover:bg-primary-dark"
        >
          العودة للوحة التحكم
          <ArrowLeft className="h-4 w-4" />
        </Link>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-extrabold text-navy">إضافة تطبيق جديد</h1>
        <p className="mt-1 text-sm text-slate-500">
          أدخل بيانات تطبيقك ليتم مراجعتها ونشرها على سندك
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="max-w-3xl space-y-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-8"
      >
        <div>
          <label htmlFor="app-name" className="mb-1.5 block text-sm font-semibold text-navy">
            اسم التطبيق
          </label>
          <input
            id="app-name"
            type="text"
            required
            placeholder="مثال: سوق السودان"
            className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none transition-colors focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/20"
          />
        </div>

        <div>
          <label htmlFor="app-desc" className="mb-1.5 block text-sm font-semibold text-navy">
            وصف التطبيق
          </label>
          <textarea
            id="app-desc"
            required
            rows={4}
            placeholder="اكتب وصفًا مختصرًا وواضحًا عن تطبيقك ووظائفه"
            className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition-colors focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/20"
          />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div>
            <label htmlFor="app-category" className="mb-1.5 block text-sm font-semibold text-navy">
              التصنيف
            </label>
            <select
              id="app-category"
              required
              defaultValue=""
              className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none transition-colors focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/20"
            >
              <option value="" disabled>
                اختر التصنيف
              </option>
              {categories.map((cat) => (
                <option key={cat.slug} value={cat.slug}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="app-version" className="mb-1.5 block text-sm font-semibold text-navy">
              الإصدار
            </label>
            <input
              id="app-version"
              type="text"
              required
              placeholder="1.0.0"
              className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none transition-colors focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/20"
            />
          </div>

          <div>
            <label htmlFor="app-size" className="mb-1.5 block text-sm font-semibold text-navy">
              حجم التطبيق
            </label>
            <input
              id="app-size"
              type="text"
              required
              placeholder="25 MB"
              className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none transition-colors focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/20"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <UploadZone label="شعار التطبيق" hint="PNG أو JPG (512×512)" />
          <UploadZone label="Screenshots" hint="حتى 5 صور" />
          <UploadZone label="ملف APK" hint="سيتم تفعيل الرفع لاحقًا" />
        </div>

        <button
          type="submit"
          className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary text-sm font-bold text-white transition-colors hover:bg-primary-dark sm:w-auto sm:px-8"
        >
          <Send className="h-4 w-4" />
          إرسال للمراجعة
        </button>
      </form>
    </div>
  );
}
