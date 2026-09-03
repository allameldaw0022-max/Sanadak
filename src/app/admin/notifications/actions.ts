"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

// RLS (notifications_update_own) is the real enforcement here, exactly as
// in the user-facing markNotificationReadAction: user_id must equal
// auth.uid() for both the row being updated (using) and the new value
// (with check), so this can never mark another admin's -- or any other
// user's -- notification read, regardless of what id is passed in.
export async function markAdminNotificationReadAction(notificationId: string) {
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

  revalidatePath("/admin", "layout");
}

// Same RLS boundary as above (.eq("user_id", user.id)) -- this can only
// ever touch this admin's own notification rows, never another admin's.
export async function markAllAdminNotificationsReadAction() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  await supabase
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("user_id", user.id)
    .like("type", "admin_%")
    .is("read_at", null);

  revalidatePath("/admin", "layout");
}
