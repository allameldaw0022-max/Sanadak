-- Fix: devices_select_claimant (added in the ownership_claims_workflow
-- migration) directly queried ownership_claims, whose own Phase 1 SELECT
-- policy (ownership_claims_select_related) queries back into devices for
-- its "device owner can see claims on their device" branch -- an RLS
-- policy cycle. Postgres detected it live: "infinite recursion detected
-- in policy for relation devices", surfaced by register_device's own
-- INSERT ... RETURNING (RETURNING is subject to the table's SELECT-policy
-- visibility check), so this would have broken every device registration,
-- not just claim-related reads.
--
-- Standard fix: wrap the cross-table existence check in a SECURITY
-- DEFINER function, the same mechanism current_user_role() already uses
-- to read profiles without re-triggering profiles' own RLS. The function
-- bypasses RLS internally, so checking it from devices' policy no longer
-- re-enters ownership_claims' policy.

create or replace function public.is_claimant_of_device(p_device_id uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from public.ownership_claims c
    where c.device_id = p_device_id and c.claimant_id = auth.uid()
  );
$$;

drop policy if exists devices_select_claimant on public.devices;

create policy devices_select_claimant on public.devices
  for select using (public.is_claimant_of_device(devices.id));
