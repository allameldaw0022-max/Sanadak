import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/supabase/queries";
import { Container } from "@/components/ui/Container";
import { OwnershipClaimForm } from "@/components/devices/OwnershipClaimForm";

export const metadata: Metadata = {
  title: "تقديم مطالبة ملكية | سندك",
};

export default async function NewOwnershipClaimPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  return (
    <Container className="py-8 sm:py-12">
      <OwnershipClaimForm />
    </Container>
  );
}
