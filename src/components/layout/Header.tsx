import Link from "next/link";
import { Search, LogOut, LayoutDashboard, ShieldCheck } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { getCurrentUser } from "@/lib/supabase/queries";
import { signOutAction } from "@/app/auth/actions";

const navLinks = [
  { href: "/", label: "الرئيسية" },
  { href: "/apps", label: "التطبيقات" },
  { href: "/categories", label: "التصنيفات" },
];

export async function Header() {
  const user = await getCurrentUser();

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/90 backdrop-blur-sm">
      <Container className="flex h-16 items-center justify-between gap-4">
        <Link href="/" className="flex shrink-0 items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-base font-extrabold text-white">
            س
          </span>
          <span className="text-lg font-extrabold text-navy">سندك</span>
        </Link>

        <nav className="hidden items-center gap-6 md:flex">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm font-semibold text-slate-600 transition-colors hover:text-primary"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <Link
            href="/search"
            aria-label="بحث"
            className="flex h-10 w-10 items-center justify-center rounded-xl text-slate-600 transition-colors hover:bg-slate-100 md:hidden"
          >
            <Search className="h-5 w-5" />
          </Link>

          {!user && (
            <Link
              href="/developer/register"
              className="hidden h-10 items-center rounded-xl border border-navy px-4 text-sm font-bold text-navy transition-colors hover:bg-navy hover:text-white sm:flex"
            >
              للمطورين
            </Link>
          )}

          {!user && (
            <Link
              href="/login"
              className="flex h-10 items-center rounded-xl bg-navy px-4 text-sm font-bold text-white transition-colors hover:bg-slate-800"
            >
              تسجيل الدخول
            </Link>
          )}

          {user && (
            <>
              {user.role === "developer" && (
                <Link
                  href="/developer/dashboard"
                  className="hidden h-10 items-center gap-2 rounded-xl border border-slate-200 px-4 text-sm font-bold text-navy transition-colors hover:bg-slate-50 sm:flex"
                >
                  <LayoutDashboard className="h-4 w-4" />
                  لوحة التحكم
                </Link>
              )}
              {user.role === "admin" && (
                <Link
                  href="/admin/apps"
                  className="hidden h-10 items-center gap-2 rounded-xl border border-slate-200 px-4 text-sm font-bold text-navy transition-colors hover:bg-slate-50 sm:flex"
                >
                  <ShieldCheck className="h-4 w-4" />
                  المراجعة
                </Link>
              )}
              <span className="hidden max-w-[10rem] truncate text-sm font-semibold text-slate-600 md:inline">
                {user.fullName || user.email}
              </span>
              <form action={signOutAction}>
                <button
                  type="submit"
                  aria-label="تسجيل الخروج"
                  className="flex h-10 items-center gap-2 rounded-xl bg-navy px-4 text-sm font-bold text-white transition-colors hover:bg-slate-800"
                >
                  <LogOut className="h-4 w-4" />
                  <span className="hidden sm:inline">خروج</span>
                </button>
              </form>
            </>
          )}
        </div>
      </Container>
    </header>
  );
}
