import type { Metadata } from "next";
import { Cairo } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { MobileNav } from "@/components/layout/MobileNav";
import { getCurrentUser } from "@/lib/supabase/queries";
import { SITE_URL, SITE_NAME } from "@/lib/site";

const cairo = Cairo({
  variable: "--font-cairo",
  subsets: ["arabic", "latin"],
  weight: ["400", "500", "600", "700", "800"],
});

const defaultDescription = "اكتشف التطبيقات السودانية وحمّلها بسهولة وأمان من مكان واحد.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: `${SITE_NAME} | متجر تطبيقات سوداني`,
  description: defaultDescription,
  openGraph: {
    siteName: SITE_NAME,
    type: "website",
    locale: "ar_SD",
    title: `${SITE_NAME} | متجر تطبيقات سوداني`,
    description: defaultDescription,
  },
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const user = await getCurrentUser();
  const accountHref = !user
    ? "/login"
    : user.role === "admin"
      ? "/admin"
      : user.role === "developer"
        ? "/developer/dashboard"
        : "/account";

  return (
    <html lang="ar" dir="rtl" className={`${cairo.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-bg text-navy">
        <Header />
        <main className="flex-1 pb-20 md:pb-0">{children}</main>
        <Footer />
        <MobileNav accountHref={accountHref} />
      </body>
    </html>
  );
}
