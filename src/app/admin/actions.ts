"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/supabase/queries";

// Defense in depth: RLS already restricts writes to admins or the app's own
// developer, but a developer legitimately owns their own row, so this
// explicit role check is what actually stops a developer from calling this
// action on their own app to self-approve it.
async function requireAdmin() {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") {
    throw new Error("غير مصرح: هذا الإجراء متاح للمشرفين فقط.");
  }
  return user;
}

export async function setDealerStatusAction(formData: FormData) {
  await requireAdmin();
  const userId = formData.get("userId") as string;
  const isDealer = formData.get("isDealer") === "true";

  const supabase = await createClient();
  await supabase.from("profiles").update({ is_dealer: isDealer }).eq("id", userId);

  revalidatePath("/admin/users");
}
