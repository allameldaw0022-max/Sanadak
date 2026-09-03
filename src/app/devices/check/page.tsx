import type { Metadata } from "next";
import { ShieldCheck } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { ImeiCheckForm } from "@/components/devices/ImeiCheckForm";

export const metadata: Metadata = {
  title: "تحقق من IMEI | سندك",
  description: "افحص حالة أي جهاز عبر رقم IMEI قبل الشراء.",
  alternates: {
    canonical: "/devices/check",
  },
};

export default function CheckImeiPage() {
  return (
    <Container className="py-10 sm:py-14">
      <div className="mx-auto max-w-xl text-center">
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-light text-primary-dark">
          <ShieldCheck className="h-7 w-7" />
        </span>
        <h1 className="mt-4 text-2xl font-extrabold text-navy sm:text-3xl">افحص جهازك قبل ما تشتريه</h1>
        <p className="mt-2 text-sm text-slate-500">
          أدخل رقم IMEI للتحقق من حالة الجهاز — يظهر خلف شاشة الجهاز أو بالاتصال بـ{" "}
          <span dir="ltr">*#06#</span>.
        </p>
      </div>

      <div className="mx-auto mt-8 max-w-xl">
        <ImeiCheckForm />
      </div>
    </Container>
  );
}
