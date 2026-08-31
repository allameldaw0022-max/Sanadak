import Link from "next/link";
import { Container } from "@/components/ui/Container";

const quickLinks = [
  { href: "/", label: "الرئيسية" },
  { href: "/apps", label: "التطبيقات" },
  { href: "/categories", label: "التصنيفات" },
  { href: "/developer/register", label: "للمطورين" },
];

export function Footer() {
  return (
    <footer className="hidden border-t border-slate-200 bg-white md:block">
      <Container className="grid grid-cols-1 gap-10 py-12 sm:grid-cols-3">
        <div>
          <Link href="/" className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-base font-extrabold text-white">
              س
            </span>
            <span className="text-lg font-extrabold text-navy">سندك</span>
          </Link>
          <p className="mt-3 max-w-xs text-sm leading-relaxed text-slate-500">
            متجر تطبيقات سوداني يتيح لك اكتشاف وتحميل التطبيقات السودانية بسهولة وأمان.
          </p>
        </div>

        <div>
          <h3 className="text-sm font-bold text-navy">روابط سريعة</h3>
          <ul className="mt-4 space-y-3">
            {quickLinks.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="text-sm text-slate-500 transition-colors hover:text-primary"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="text-sm font-bold text-navy">تواصل معنا</h3>
          <ul className="mt-4 space-y-3 text-sm text-slate-500">
            <li>info@sanadak.sd</li>
            <li>الخرطوم، السودان</li>
          </ul>
        </div>
      </Container>

      <div className="border-t border-slate-100 py-5">
        <Container>
          <p className="text-center text-xs text-slate-400">
            © {new Date().getFullYear()} سندك. جميع الحقوق محفوظة.
          </p>
        </Container>
      </div>
    </footer>
  );
}
