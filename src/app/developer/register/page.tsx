"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { UserPlus, CheckCircle2, ArrowLeft } from "lucide-react";
import { Container } from "@/components/ui/Container";

export default function DeveloperRegisterPage() {
  const [submitted, setSubmitted] = useState(false);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitted(true);
  }

  return (
    <Container className="flex min-h-[70vh] items-center justify-center py-12">
      <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="mb-6 text-center">
          <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-primary-light text-primary">
            <UserPlus className="h-6 w-6" />
          </span>
          <h1 className="mt-4 text-xl font-extrabold text-navy">سجل كمطور في سندك</h1>
          <p className="mt-1 text-sm text-slate-500">
            انضم إلى منصتنا وانشر تطبيقاتك ليصلها آلاف المستخدمين
          </p>
        </div>

        {submitted ? (
          <div className="flex flex-col items-center gap-3 py-8 text-center">
            <CheckCircle2 className="h-10 w-10 text-primary" />
            <p className="text-sm font-semibold text-navy">تم إنشاء حسابك بنجاح</p>
            <p className="text-xs text-slate-500">
              هذه نسخة تجريبية — سيتم تفعيل التسجيل الفعلي لاحقًا.
            </p>
            <Link
              href="/developer/dashboard"
              className="mt-3 flex h-11 items-center gap-2 rounded-xl bg-primary px-6 text-sm font-bold text-white hover:bg-primary-dark"
            >
              الذهاب للوحة التحكم
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="fullname" className="mb-1.5 block text-sm font-semibold text-navy">
                  الاسم الكامل
                </label>
                <input
                  id="fullname"
                  type="text"
                  required
                  placeholder="اسمك أو اسم شركتك"
                  className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none transition-colors focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/20"
                />
              </div>
              <div>
                <label htmlFor="phone" className="mb-1.5 block text-sm font-semibold text-navy">
                  رقم الهاتف
                </label>
                <input
                  id="phone"
                  type="tel"
                  required
                  placeholder="09xxxxxxxx"
                  className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none transition-colors focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/20"
                />
              </div>
            </div>

            <div>
              <label htmlFor="dev-email" className="mb-1.5 block text-sm font-semibold text-navy">
                البريد الإلكتروني
              </label>
              <input
                id="dev-email"
                type="email"
                required
                placeholder="developer@example.com"
                className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none transition-colors focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/20"
              />
            </div>

            <div>
              <label htmlFor="dev-password" className="mb-1.5 block text-sm font-semibold text-navy">
                كلمة المرور
              </label>
              <input
                id="dev-password"
                type="password"
                required
                placeholder="••••••••"
                className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none transition-colors focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/20"
              />
            </div>

            <button
              type="submit"
              className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary text-sm font-bold text-white transition-colors hover:bg-primary-dark"
            >
              <UserPlus className="h-4 w-4" />
              إنشاء حساب مطور
            </button>
          </form>
        )}

        <p className="mt-6 text-center text-sm text-slate-500">
          لديك حساب بالفعل؟{" "}
          <Link href="/login" className="font-semibold text-primary hover:text-primary-dark">
            تسجيل الدخول
          </Link>
        </p>
      </div>
    </Container>
  );
}
