import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/supabase/queries";
import { Container } from "@/components/ui/Container";
import { RegisterDeviceForm } from "@/components/devices/RegisterDeviceForm";
import { loginUrlWithReturn } from "@/lib/auth/return-path";

export const metadata: Metadata = {
  title: "تسجيل جهاز جديد | سندك",
  robots: { index: false },
};

export default async function NewDevicePage() {
  const user = await getCurrentUser();
  // "/devices/new" is a fixed literal, not derived from any request input --
  // see return-path.ts for why this can never become an open redirect.
  if (!user) redirect(loginUrlWithReturn("/devices/new"));

  return (
    <Container className="py-8 sm:py-12">
      <RegisterDeviceForm />
    </Container>
  );
}
