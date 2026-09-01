-- Phase 2 of the device verification system: two small RPCs the new
-- Server Actions call. Purely additive on top of the Phase 1 tables
-- (devices, device_imeis) -- no existing app-store table touched, no
-- existing Phase 1 table/column/policy changed.

-- ---------------------------------------------------------------------
-- 1. register_device: atomic device + IMEI(s) creation.
--
--    SECURITY INVOKER (the default -- no "security definer" here on
--    purpose): this function does NOT bypass RLS. It relies entirely on
--    the Phase 1 policies (devices_insert_own, device_imeis_insert_own)
--    to authorize the inserts, the same way any direct client insert
--    would be authorized. That keeps RLS a genuine second layer of
--    defense under this function, not just decoration -- a bug in this
--    function's logic still can't let it write a device for anyone but
--    the caller, because Postgres itself would reject that insert.
--
--    owner_id comes ONLY from auth.uid() -- there is no p_owner_id
--    parameter, so there is nothing for a client to spoof. Likewise
--    there is no status parameter: devices.current_status always takes
--    its table default ('ACTIVE').
--
--    Atomicity: a single RPC call is one implicit transaction. If the
--    IMEI insert fails (e.g. imei_normalized already taken by another
--    device, or imei1 = imei2 -- both caught by the SAME unique
--    constraint from Phase 1, since it's table-wide), the whole function
--    aborts and Postgres rolls back the device insert too. No orphan
--    device row can survive a failed IMEI insert.
-- ---------------------------------------------------------------------

create or replace function public.register_device(
  p_brand text,
  p_model text,
  p_color text,
  p_serial_number text,
  p_imei1_normalized text,
  p_imei1_hash text,
  p_imei2_normalized text default null,
  p_imei2_hash text default null
)
returns uuid
language plpgsql
set search_path = public
as $$
declare
  v_device_id uuid;
begin
  if auth.uid() is null then
    raise exception 'authentication required';
  end if;

  insert into public.devices (owner_id, brand, model, color, serial_number)
  values (auth.uid(), p_brand, p_model, p_color, p_serial_number)
  returning id into v_device_id;

  insert into public.device_imeis (device_id, imei_normalized, imei_hash, kind)
  values (v_device_id, p_imei1_normalized, p_imei1_hash, 'imei1');

  if p_imei2_normalized is not null then
    insert into public.device_imeis (device_id, imei_normalized, imei_hash, kind)
    values (v_device_id, p_imei2_normalized, p_imei2_hash, 'imei2');
  end if;

  return v_device_id;
end;
$$;

revoke execute on function public.register_device(text, text, text, text, text, text, text, text) from anon, public;
grant execute on function public.register_device(text, text, text, text, text, text, text, text) to authenticated;

-- ---------------------------------------------------------------------
-- 2. public_check_device_status: the ONLY way anon/authenticated can ever
--    read anything derived from devices/device_imeis, which otherwise
--    have no public SELECT policy at all (owner/admin only, Phase 1).
--
--    SECURITY DEFINER on purpose here -- it must bypass RLS to look up a
--    device that doesn't belong to the caller. What makes this safe is
--    that the function's `returns table` clause only ever names one
--    column, current_status: there is no code path inside it that can
--    return owner_id, evidence, reports, or anything else, regardless
--    of what the caller passes in. Looked up by imei_hash (computed
--    server-side by the caller from a secret pepper), never by the raw
--    IMEI -- this function never sees or stores a raw IMEI.
--
--    Callers MUST apply rate limiting themselves before invoking this
--    (see src/app/devices/actions.ts::checkImeiAction) -- this function
--    has no throttling of its own, matching how every other rate-limited
--    action in this codebase enforces the limit in the Server Action,
--    not the database.
-- ---------------------------------------------------------------------

create or replace function public.public_check_device_status(p_imei_hash text)
returns table(status device_status)
language sql
security definer
stable
set search_path = public
as $$
  select d.current_status
  from public.device_imeis di
  join public.devices d on d.id = di.device_id
  where di.imei_hash = p_imei_hash
  limit 1;
$$;

revoke execute on function public.public_check_device_status(text) from public;
grant execute on function public.public_check_device_status(text) to anon, authenticated;
