"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/supabase/queries";

async function requireAdmin() {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") {
    throw new Error("غير مصرح: هذا الإجراء متاح للمشرفين فقط.");
  }
  return user;
}

function numberField(formData: FormData, name: string): number {
  const raw = formData.get(name);
  const value = Number(raw);
  if (raw === null || raw === "" || Number.isNaN(value)) {
    throw new Error(`قيمة غير صالحة للحقل: ${name}`);
  }
  return value;
}

export async function updatePaymentSettingsAction(formData: FormData) {
  const admin = await requireAdmin();

  const bankName = ((formData.get("bankName") as string | null) || "").trim();
  const accountHolderName = ((formData.get("accountHolderName") as string | null) || "").trim();
  const accountNumber = ((formData.get("accountNumber") as string | null) || "").trim();
  const iban = ((formData.get("iban") as string | null) || "").trim();
  const phone = ((formData.get("phone") as string | null) || "").trim();
  const paymentMethodName = ((formData.get("paymentMethodName") as string | null) || "").trim();
  const paymentInstructions = ((formData.get("paymentInstructions") as string | null) || "").trim();

  const usdToSdgRate = numberField(formData, "usdToSdgRate");
  const basicPriceUsd = numberField(formData, "basicPriceUsd");
  const proPriceUsd = numberField(formData, "proPriceUsd");
  const basicMaxApps = numberField(formData, "basicMaxApps");
  const freeTrialMaxDevelopers = numberField(formData, "freeTrialMaxDevelopers");
  const freeTrialDays = numberField(formData, "freeTrialDays");
  const gracePeriodDays = numberField(formData, "gracePeriodDays");

  if (usdToSdgRate < 0) throw new Error("سعر الصرف يجب ألا يكون سالبًا.");
  if (basicPriceUsd <= 0 || proPriceUsd <= 0) throw new Error("أسعار الخطط يجب أن تكون أكبر من صفر.");
  if (basicMaxApps <= 0) throw new Error("الحد الأقصى لتطبيقات الخطة الأساسية يجب أن يكون أكبر من صفر.");
  if (freeTrialMaxDevelopers < 0) throw new Error("عدد المطورين المؤهلين للعرض يجب ألا يكون سالبًا.");
  if (freeTrialDays <= 0) throw new Error("مدة الفترة المجانية يجب أن تكون أكبر من صفر.");
  if (gracePeriodDays < 0) throw new Error("فترة السماح يجب ألا تكون سالبة.");

  const supabase = await createClient();
  const { error } = await supabase
    .from("payment_settings")
    .update({
      bank_name: bankName,
      account_holder_name: accountHolderName,
      account_number: accountNumber,
      iban,
      phone,
      payment_method_name: paymentMethodName,
      payment_instructions: paymentInstructions,
      usd_to_sdg_rate: usdToSdgRate,
      basic_price_usd: basicPriceUsd,
      pro_price_usd: proPriceUsd,
      basic_max_apps: basicMaxApps,
      free_trial_max_developers: freeTrialMaxDevelopers,
      free_trial_days: freeTrialDays,
      grace_period_days: gracePeriodDays,
      updated_by: admin.id,
    })
    .eq("id", 1);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/admin/settings/payment");
  revalidatePath("/developer/subscription");
}
