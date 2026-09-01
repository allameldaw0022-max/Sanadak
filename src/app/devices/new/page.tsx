import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/supabase/queries";
import { Container } from "@/components/ui/Container";
import { RegisterDeviceForm } from "@/components/devices/RegisterDeviceForm";

export const metadata: Metadata = {
  title: "تسجيل جهاز جديد | سندك",
};

export default async function NewDevicePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  return (
    <Container className="py-8 sm:py-12">
      <RegisterDeviceForm />
    </Container>
  );
}
