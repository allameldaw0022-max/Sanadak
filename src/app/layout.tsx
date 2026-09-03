import type { Metadata, Viewport } from "next";
import { Suspense } from "react";
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

const defaultTitle = `${SITE_NAME} | فحص وتوثيق الأجهزة`;
const defaultDescription = "منصة سودانية للتحقق من الأجهزة وتوثيق ملكيتها";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: defaultTitle,
  description: defaultDescription,
  manifest: "/manifest.webmanifest",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    siteName: SITE_NAME,
    type: "website",
    locale: "ar_SD",
    url: SITE_URL,
    title: defaultTitle,
    description: defaultDescription,
  },
  twitter: {
    card: "summary_large_image",
    title: defaultTitle,
    description: defaultDescription,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#16a34a",
};

async function AccountAwareMobileNav() {
  const user = await getCurrentUser();
  const accountHref = !user ? "/login" : user.role === "admin" ? "/admin" : "/account";

  return <MobileNav accountHref={accountHref} />;
}

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ar" dir="rtl" className={`${cairo.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-bg text-navy">
        <Header />
        <main className="flex-1 pb-20 md:pb-0">{children}</main>
        <Footer />
        <Suspense fallback={<MobileNav accountHref="/login" />}>
          <AccountAwareMobileNav />
        </Suspense>
      </body>
    </html>
  );
}
