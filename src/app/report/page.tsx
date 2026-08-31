import type { Metadata } from "next";
import { Container } from "@/components/ui/Container";
import { StandaloneReportForm } from "@/components/apps/StandaloneReportForm";
import { getApprovedApps } from "@/lib/supabase/queries";

export const metadata: Metadata = {
  title: "الإبلاغ عن تطبيق | سندك",
};

export default async function ReportPage() {
  const apps = await getApprovedApps();

  return (
    <Container className="py-8 sm:py-12">
      <div className="mx-auto max-w-lg">
        <div className="text-center">
          <h1 className="text-2xl font-extrabold text-navy sm:text-3xl">الإبلاغ عن تطبيق</h1>
          <p className="mt-2 text-sm text-slate-500">
            إذا وجدت تطبيقًا مخالفًا أو يبدو ضارًا، أخبرنا وسيراجعه فريق سندك.
          </p>
        </div>
        <div className="mt-8">
          {apps.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white py-10 text-center">
              <p className="text-sm text-slate-500">لا توجد تطبيقات منشورة حاليًا للإبلاغ عنها.</p>
            </div>
          ) : (
            <StandaloneReportForm apps={apps.map((a) => ({ id: a.id, name: a.name }))} />
          )}
        </div>
      </div>
    </Container>
  );
}
