import Link from "next/link";
import { Search } from "lucide-react";
import { Container } from "@/components/ui/Container";

const navLinks = [
  { href: "/", label: "الرئيسية" },
  { href: "/apps", label: "التطبيقات" },
  { href: "/categories", label: "التصنيفات" },
];

export function Header() {
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
          <Link
            href="/developer/register"
            className="hidden h-10 items-center rounded-xl border border-navy px-4 text-sm font-bold text-navy transition-colors hover:bg-navy hover:text-white sm:flex"
          >
            للمطورين
          </Link>
          <Link
            href="/login"
            className="flex h-10 items-center rounded-xl bg-navy px-4 text-sm font-bold text-white transition-colors hover:bg-slate-800"
          >
            تسجيل الدخول
          </Link>
        </div>
      </Container>
    </header>
  );
}
