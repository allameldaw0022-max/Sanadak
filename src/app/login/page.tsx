"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { LogIn, UserPlus, CheckCircle2, AlertCircle } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pendingConfirmation, setPendingConfirmation] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const supabase = createClient();

    if (mode === "signin") {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      setLoading(false);
      if (signInError) {
        setError("البريد الإلكتروني أو كلمة المرور غير صحيحة.");
        return;
      }
      router.push("/");
      router.refresh();
    } else {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name: fullName, role: "user" } },
      });
      setLoading(false);
      if (signUpError) {
        setError(signUpError.message.includes("already registered")
          ? "هذا البريد الإلكتروني مسجل بالفعل."
          : "تعذر إنشاء الحساب، حاول مرة أخرى.");
        return;
      }
      if (!data.session) {
        setPendingConfirmation(true);
        return;
      }
      router.push("/");
      router.refresh();
    }
  }

  return (
    <Container className="flex min-h-[70vh] items-center justify-center py-12">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="mb-6 text-center">
          <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-lg font-extrabold text-white">
            س
          </span>
          <h1 className="mt-4 text-xl font-extrabold text-navy">
            {mode === "signin" ? "تسجيل الدخول إلى سندك" : "إنشاء حساب جديد"}
          </h1>
          <p className="mt-1 text-sm text-slate-500">أدخل بياناتك للمتابعة</p>
        </div>

        <div className="mb-6 flex rounded-xl bg-slate-100 p-1">
          <button
            type="button"
            onClick={() => setMode("signin")}
            className={cn(
              "flex-1 rounded-lg py-2 text-sm font-semibold transition-colors",
              mode === "signin" ? "bg-white text-navy shadow-sm" : "text-slate-500"
            )}
          >
            تسجيل الدخول
          </button>
          <button
            type="button"
            onClick={() => setMode("signup")}
            className={cn(
              "flex-1 rounded-lg py-2 text-sm font-semibold transition-colors",
              mode === "signup" ? "bg-white text-navy shadow-sm" : "text-slate-500"
            )}
          >
            إنشاء حساب
          </button>
        </div>

        {pendingConfirmation ? (
          <div className="flex flex-col items-center gap-3 py-8 text-center">
            <CheckCircle2 className="h-10 w-10 text-primary" />
            <p className="text-sm font-semibold text-navy">تم إنشاء حسابك بنجاح</p>
            <p className="text-xs text-slate-500">
              تحقق من بريدك الإلكتروني لتأكيد الحساب قبل تسجيل الدخول.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === "signup" && (
              <div>
                <label htmlFor="fullname" className="mb-1.5 block text-sm font-semibold text-navy">
                  الاسم الكامل
                </label>
                <input
                  id="fullname"
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="اسمك الكامل"
                  className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none transition-colors focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/20"
                />
              </div>
            )}
            <div>
              <label htmlFor="email" className="mb-1.5 block text-sm font-semibold text-navy">
                البريد الإلكتروني
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
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
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none transition-colors focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/20"
              />
            </div>

            {error && (
              <p className="flex items-center gap-1.5 text-xs font-medium text-red-600">
                <AlertCircle className="h-3.5 w-3.5" />
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary text-sm font-bold text-white transition-colors hover:bg-primary-dark disabled:opacity-60"
            >
              {mode === "signin" ? <LogIn className="h-4 w-4" /> : <UserPlus className="h-4 w-4" />}
              {loading ? "جارٍ التنفيذ..." : mode === "signin" ? "تسجيل الدخول" : "إنشاء الحساب"}
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
