-- Admin Dashboard (Sanadak) needs to list notifications system-wide (section
-- 7 of the admin spec). notifications currently has only
-- notifications_select_own (user_id = auth.uid()) -- every other
-- Sandak-related table already has an admin-inclusive SELECT policy
-- (ownership_claims_select_related, device_reports_select_related,
-- device_certificates_select_own_or_admin, apk_security_scans_select_own_or_admin,
-- security_events_select_own_or_admin, ...) except this one, which was simply
-- never revisited when the admin dashboard didn't exist yet.
--
-- Purely additive: a second SELECT policy alongside the existing one (RLS
-- policies for the same command are OR'd), same current_user_role() = 'admin'
-- check already used everywhere else in this schema. Does not touch, drop,
-- or narrow notifications_select_own/insert_own/update_own, and does not
-- grant INSERT/UPDATE/DELETE to admin -- read-only visibility only.

create policy notifications_select_admin on public.notifications
  for select using (current_user_role() = 'admin');
