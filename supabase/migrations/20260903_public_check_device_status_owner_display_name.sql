-- ---------------------------------------------------------------------
-- public_check_device_status(): add a privacy-masked owner display name
-- to the disclosed-status result, without changing anything else about
-- how this function decides what a stranger is allowed to learn.
--
-- Return type is changing (status) -> (status, owner_display_name), which
-- Postgres does not allow via plain CREATE OR REPLACE for a RETURNS TABLE
-- function -- hence DROP + CREATE below. Nothing else about the function's
-- identity (name, argument list, security posture) changes, and nothing
-- depends on it (verified: no pg_depend entries), so the drop is safe.
--
-- What's new: owner_display_name is populated ONLY when current_status is
-- one of ACTIVE / UNDER_REVIEW / RECOVERED -- the exact set of statuses
-- src/lib/devices/check-response.ts already treats as "safe to disclose
-- the device is fine". BLOCKED, LOST and STOLEN never populate it (the
-- masking branch below simply never runs for them), and "not found" keeps
-- returning zero rows exactly as before -- so the existing anti-
-- enumeration guarantee (not-found and BLOCKED are indistinguishable to
-- the caller) is completely untouched; this migration only ever adds an
-- extra column, never changes which rows/columns were already exposed.
--
-- The name itself is derived from profiles.full_name, looked up by
-- devices.owner_id -- resolved entirely inside this SECURITY DEFINER
-- function (the same bypass-RLS posture this function already had, now
-- also covering one more table), never by a second round-trip the client
-- could tamper with. It is masked to "الاسم_الأول حرف_العائلة." before
-- ever leaving the database; the full name never crosses this boundary.
-- No other column of profiles is read or returned.
-- ---------------------------------------------------------------------

drop function if exists public.public_check_device_status(text);

create function public.public_check_device_status(p_imei_hash text)
returns table(status device_status, owner_display_name text)
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_hash_allowed boolean;
  v_user_allowed boolean;
  v_status device_status;
  v_owner_id uuid;
  v_full_name text;
  v_name_parts text[];
  v_masked_name text;
begin
  -- Rate limiting: unchanged from the previous version of this function.
  select allowed into v_hash_allowed
    from public.check_and_increment_rate_limit('device_check:hash:' || p_imei_hash, 30, 3600);
  if not v_hash_allowed then
    raise exception 'RATE_LIMITED';
  end if;

  if auth.uid() is not null then
    select allowed into v_user_allowed
      from public.check_and_increment_rate_limit('device_check:user:' || auth.uid()::text, 60, 3600);
    if not v_user_allowed then
      raise exception 'RATE_LIMITED';
    end if;
  end if;

  select d.current_status, d.owner_id
    into v_status, v_owner_id
  from public.device_imeis di
  join public.devices d on d.id = di.device_id
  where di.imei_hash = p_imei_hash
  limit 1;

  if v_status is null then
    -- Not found: zero rows, byte-for-byte the same as the previous
    -- version's `select ... limit 1` returning no row.
    return;
  end if;

  if v_status in ('ACTIVE', 'UNDER_REVIEW', 'RECOVERED') then
    select p.full_name into v_full_name from public.profiles p where p.id = v_owner_id;

    -- No matching/valid profile row, or an empty name -- leave
    -- v_masked_name NULL rather than failing the check. A device can only
    -- ever have owner_id set by register_device() (always the caller's
    -- own auth.uid(), backed by a profiles row from handle_new_user), so
    -- this branch is defense-in-depth, not an expected case.
    if v_full_name is not null and length(btrim(v_full_name)) > 0 then
      v_name_parts := regexp_split_to_array(btrim(v_full_name), '\s+');
      if coalesce(array_length(v_name_parts, 1), 0) >= 2 then
        -- "أحمد محمد عبد الله" -> "أحمد م."
        v_masked_name := v_name_parts[1] || ' ' || left(v_name_parts[2], 1) || '.';
      else
        -- Single-word name: nothing left to mask beyond the first word.
        v_masked_name := v_name_parts[1];
      end if;
    end if;
  end if;
  -- Any other status (BLOCKED, LOST, STOLEN): v_masked_name stays NULL --
  -- this branch never runs for them, by construction, not by a runtime
  -- check that could be bypassed.

  return query select v_status, v_masked_name;
end;
$function$;

-- Same caller set as before: anon (public IMEI check) and authenticated
-- (signed-in users checking too). service_role already bypasses grants
-- entirely. Explicit REVOKE+GRANT regardless of default privileges, for
-- the same auditability reason the original migration used it.
revoke execute on function public.public_check_device_status(text) from public;
grant execute on function public.public_check_device_status(text) to anon, authenticated;
