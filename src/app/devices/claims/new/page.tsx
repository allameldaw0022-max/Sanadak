import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/supabase/queries";
import { Container } from "@/components/ui/Container";
import { OwnershipClaimForm } from "@/components/devices/OwnershipClaimForm";
import { loginUrlWithReturn } from "@/lib/auth/return-path";

export const metadata: Metadata = {
  title: "تقديم مطالبة ملكية | سندك",
  robots: { index: false },
};

export default async function NewOwnershipClaimPage() {
  const user = await getCurrentUser();
  // "/devices/claims/new" is a fixed literal, not derived from any request
  // input -- see return-path.ts for why this can never become an open
  // redirect.
  if (!user) redirect(loginUrlWithReturn("/devices/claims/new"));

  return (
    <Container className="py-8 sm:py-12">
      <OwnershipClaimForm />
    </Container>
  );
}
