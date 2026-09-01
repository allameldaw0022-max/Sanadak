-- Phase 5 audit finding, fixed inline per the "safe decision, keep going"
-- rule: profiles_update_own_or_admin (pre-existing, Phase 0/1) lets a user
-- update THEIR OWN profiles row via any client holding the anon/authenticated
-- key -- including from a browser console, completely bypassing this app's
-- UI/Server Actions -- but the policy has no column-level restriction. That
-- means, right now, any signed-in user can call
-- supabase.from('profiles').update({ role: 'admin' }).eq('id', ownUid) and
-- self-promote to admin. Adding is_dealer to the same row (certificates_
-- dealers migration) would have inherited the exact same self-escalation
-- gap for the new flag.
--
-- Fix: same trigger-based column-protection pattern already used for
-- devices.current_status/owner_id (protect_device_protected_columns) --
-- force role/is_dealer back to their prior value on any UPDATE that isn't
-- performed by service_role or an existing admin. This does not remove any
-- capability: admins can still change any profile's role/is_dealer (e.g.
-- via setDealerStatusAction), which is the only place that ever wrote
-- either column app-side to begin with.

create or replace function public.protect_profile_protected_columns()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.role() = 'service_role' or public.current_user_role() = 'admin' then
    return new;
  end if;
  new.role := old.role;
  new.is_dealer := old.is_dealer;
  return new;
end;
$$;

create trigger profiles_protect_columns_update
  before update on public.profiles
  for each row execute function public.protect_profile_protected_columns();
