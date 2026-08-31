"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { LogIn, CheckCircle2 } from "lucide-react";
import { Container } from "@/components/ui/Container";

export default function LoginPage() {
  const [submitted, setSubmitted] = useState(false);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitted(true);
  }

  return (
    <Container className="flex min-h-[70vh] items-center justify-center py-12">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="mb-6 text-center">
          <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-lg font-extrabold text-white">
            س
          </span>
          <h1 className="mt-4 text-xl font-extrabold text-navy">تسجيل الدخول إلى سندك</h1>
          <p className="mt-1 text-sm text-slate-500">أدخل بياناتك للمتابعة</p>
        </div>

        {submitted ? (
          <div className="flex flex-col items-center gap-3 py-8 text-center">
            <CheckCircle2 className="h-10 w-10 text-primary" />
            <p className="text-sm font-semibold text-navy">تم استقبال بياناتك بنجاح</p>
            <p className="text-xs text-slate-500">
              هذه نسخة تجريبية — سيتم تفعيل تسجيل الدخول الفعلي لاحقًا.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="mb-1.5 block text-sm font-semibold text-navy">
                البريد الإلكتروني
              </label>
              <input
                id="email"
                type="email"
                required
                placeholder="example@sanadak.sd"
                className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none transition-colors focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/20"
              />
            </div>
            <div>
              <label htmlFor="password" className="mb-1.5 block text-sm font-semibold text-navy">
                كلمة المرور
              </label>
              <input
                id="password"
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
              <LogIn className="h-4 w-4" />
              تسجيل الدخول
            </button>
          </form>
        )}

        <p className="mt-6 text-center text-sm text-slate-500">
          مطور ولا تملك حسابًا؟{" "}
          <Link href="/developer/register" className="font-semibold text-primary hover:text-primary-dark">
            سجل كمطور
          </Link>
        </p>
      </div>
    </Container>
  );
}
