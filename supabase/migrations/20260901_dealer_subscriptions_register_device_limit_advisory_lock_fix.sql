-- Corrective follow-up to dealer_subscriptions_register_device_limit: live
-- testing found that `SELECT ... FOR UPDATE` on dealer_subscriptions,
-- combined with its RLS policy, spuriously returns zero rows in this
-- environment -- reproduced even for an admin caller on a completely
-- unfiltered `SELECT ... FOR UPDATE` (a plain SELECT without FOR UPDATE
-- returns the row correctly). Replaces the row lock with a
-- transaction-scoped advisory lock keyed by the dealer's uid
-- (pg_advisory_xact_lock), which serializes concurrent register_device()
-- calls from the same dealer identically, without touching row locking or
-- RLS at all. No behavior change for the caller; this migration only fixes
-- how the concurrency guard is implemented. (The function body below is
-- otherwise byte-for-byte identical to the previous migration.)

drop function public.register_device(text, text, text, text, text, text, text, text);

create function public.register_device(
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
  v_is_dealer boolean;
  v_max_devices integer;
  v_status dealer_subscription_status;
  v_expires_at timestamptz;
  v_current_count integer;
begin
  if auth.uid() is null then
    raise exception 'authentication required';
  end if;

  select is_dealer into v_is_dealer from public.profiles where id = auth.uid();

  if v_is_dealer then
    perform pg_advisory_xact_lock(hashtext(auth.uid()::text)::bigint);

    select max_devices_snapshot, status, expires_at
      into v_max_devices, v_status, v_expires_at
      from public.dealer_subscriptions
      where dealer_id = auth.uid();

    if v_max_devices is null or v_status <> 'active' or v_expires_at < now() then
      raise exception 'لا يوجد اشتراك فعال. يرجى الاشتراك أو تجديد الاشتراك أولاً.';
    end if;

    select count(*) into v_current_count
      from public.devices
      where owner_id = auth.uid();

    if v_current_count >= v_max_devices then
      raise exception 'تم بلوغ الحد الأقصى لعدد الأجهزة المسموح به في خطتك الحالية.';
    end if;
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
