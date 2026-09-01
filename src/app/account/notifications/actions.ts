"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

// RLS (notifications_update_own) is the real enforcement -- user_id must
// equal auth.uid() for both the row being updated (using) and the new
// value (with check), so this can never mark another user's notification
// read.
export async function markNotificationReadAction(notificationId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  await supabase
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("id", notificationId)
    .eq("user_id", user.id);

  revalidatePath("/account/notifications");
}
