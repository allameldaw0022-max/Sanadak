import { ShieldCheck } from "lucide-react";
import { Container } from "./Container";
import { ImeiCheckForm } from "@/components/devices/ImeiCheckForm";

export function HeroSection() {
  return (
    <section className="border-b border-slate-200 bg-white">
      <Container className="flex flex-col items-center gap-3 py-9 text-center sm:py-12">
        <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-light text-primary-dark">
          <ShieldCheck className="h-6 w-6" />
        </span>
        <h1 className="max-w-xl text-balance text-2xl font-extrabold leading-tight text-navy sm:text-3xl md:text-4xl">
          تحقق من جهازك قبل الشراء
        </h1>
        <p className="max-w-md text-balance text-sm leading-relaxed text-slate-500 sm:text-base">
          افحص رقم IMEI وتأكد من حالة الجهاز قبل إتمام عملية الشراء.
        </p>

        <div className="mt-4 w-full max-w-xl">
          <ImeiCheckForm />
        </div>
      </Container>
    </section>
  );
}
