import { ShieldCheck, EyeOff, BadgeCheck, Globe } from "lucide-react";
import { Container } from "@/components/ui/Container";

// Every point here describes a capability the app already has today (no
// stats, no superlatives) -- see the four existing systems it names:
// checkImeiAction (anonymous), the masked owner name / anti-enumeration
// design in check-response.ts, certificate QR verification (/verify), and
// the Arabic/RTL UI itself. Purely presentational, no data fetching.
const points = [
  {
    icon: ShieldCheck,
    title: "فحص فوري بلا تسجيل",
    desc: "اعرف حالة الجهاز دون الحاجة لإنشاء حساب.",
  },
  {
    icon: EyeOff,
    title: "بياناتك محمية",
    desc: "لا نعرض رقم الجهاز الكامل أو هوية المالك الكاملة للزوار.",
  },
  {
    icon: BadgeCheck,
    title: "شهادات قابلة للتحقق",
    desc: "يمكن التحقق من شهادة الملكية عبر QR.",
  },
  {
    icon: Globe,
    title: "مصمم للسوق السوداني",
    desc: "منصة عربية وبواجهة مصممة لتناسب احتياجات المستخدم السوداني.",
  },
];

export function WhySanadak() {
  return (
    <section aria-labelledby="why-sanadak-heading" className="bg-bg">
      <Container className="py-10 sm:py-14">
        <h2 id="why-sanadak-heading" className="text-center text-xl font-extrabold text-navy sm:text-2xl">
          لماذا سندك؟
        </h2>

        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {points.map((point) => (
            <div key={point.title} className="rounded-2xl border border-slate-200 bg-white p-5">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary-light text-primary-dark">
                <point.icon className="h-5 w-5" aria-hidden="true" />
              </span>
              <p className="mt-3 text-sm font-bold text-navy">{point.title}</p>
              <p className="mt-1 text-xs leading-relaxed text-slate-500">{point.desc}</p>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}
