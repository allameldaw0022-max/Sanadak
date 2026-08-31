"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function submitPaymentRequestAction(formData: FormData) {
  const plan = formData.get("plan") as string;
  const payerName = formData.get("payerName") as string;
  const transactionReference = formData.get("transactionReference") as string;
  const transferDate = formData.get("transferDate") as string;
  const proofPath = formData.get("proofPath") as string;
  const note = (formData.get("note") as string | null) || null;

  if (plan !== "basic" && plan !== "pro") {
    throw new Error("خطة غير صالحة.");
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    throw new Error("يجب تسجيل الدخول أولًا.");
  }

  const { error } = await supabase.rpc("create_payment_request", {
    p_plan: plan,
    p_payer_name: payerName,
    p_transaction_reference: transactionReference,
    p_transfer_date: transferDate,
    p_proof_path: proofPath,
    p_note: note ?? undefined,
  });

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/developer/subscription");
}
