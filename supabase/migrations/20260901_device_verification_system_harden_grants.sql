-- Follow-up hardening for the device_verification_system migration, based on
-- get_advisors (security) findings run right after applying it:
--
-- 1. `revoke ... from public` alone did not strip anon's EXECUTE on the new
--    admin-only RPCs, because Supabase's default privileges grant EXECUTE
--    directly to anon/authenticated on every new function in public, which
--    is independent of the PUBLIC pseudo-role grant. Revoking from anon
--    explicitly (in addition to public) is required.
-- 2. imei_luhn_valid and is_valid_device_status_transition were missing
--    `set search_path`, flagged as function_search_path_mutable.
-- 3. The two trigger-only functions (protect_device_protected_columns,
--    reopen_claim_after_evidence) don't need to be directly RPC-callable at
--    all -- only the trigger mechanism needs to invoke them.

-- Admin-only RPCs: anon must never be able to call these directly over
-- PostgREST. authenticated keeps EXECUTE -- the function itself still checks
-- current_user_role() = 'admin' internally and raises otherwise, so a
-- non-admin authenticated caller gets a clean error, not silent bypass.
revoke execute on function public.transition_device_status(uuid, device_status, text, text) from anon, public;
revoke execute on function public.review_ownership_claim(uuid, ownership_claim_status, text) from anon, public;
revoke execute on function public.review_device_report(uuid, device_report_status, text) from anon, public;

-- Trigger-only functions: nobody should call these directly via RPC.
revoke execute on function public.protect_device_protected_columns() from anon, authenticated, public;
revoke execute on function public.reopen_claim_after_evidence() from anon, authenticated, public;

-- Fix mutable search_path on the two pure helper functions.
create or replace function public.imei_luhn_valid(p_imei text)
returns boolean
language plpgsql
immutable
set search_path = public
as $$
declare
  digit int;
  total int := 0;
  double_it boolean := false;
  i int;
begin
  if p_imei is null or p_imei !~ '^[0-9]{15}$' then
    return false;
  end if;
  for i in reverse 15..1 loop
    digit := substring(p_imei from i for 1)::int;
    if double_it then
      digit := digit * 2;
      if digit > 9 then
        digit := digit - 9;
      end if;
    end if;
    total := total + digit;
    double_it := not double_it;
  end loop;
  return (total % 10) = 0;
end;
$$;

create or replace function public.is_valid_device_status_transition(p_old device_status, p_new device_status)
returns boolean
language sql
immutable
set search_path = public
as $$
  select case p_old
    when 'ACTIVE'       then p_new in ('UNDER_REVIEW', 'LOST', 'STOLEN', 'BLOCKED')
    when 'UNDER_REVIEW'  then p_new in ('ACTIVE', 'LOST', 'STOLEN', 'BLOCKED')
    when 'LOST'          then p_new in ('UNDER_REVIEW', 'RECOVERED', 'STOLEN', 'BLOCKED')
    when 'STOLEN'        then p_new in ('UNDER_REVIEW', 'RECOVERED', 'LOST', 'BLOCKED')
    when 'RECOVERED'     then p_new in ('ACTIVE', 'BLOCKED')
    when 'BLOCKED'       then p_new in ('ACTIVE', 'UNDER_REVIEW')
    else false
  end;
$$;
