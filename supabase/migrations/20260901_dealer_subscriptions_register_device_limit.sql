-- Adds dealer device-limit enforcement to register_device(). Regular
-- (non-dealer) users are completely unaffected -- the whole block below is
-- skipped unless the caller's own profile has is_dealer = true, preserving
-- exactly today's unlimited-registration behavior for everyone else.
--
-- Still SECURITY INVOKER (unchanged) -- this function still does not bypass
-- RLS; the new SELECT on dealer_subscriptions is authorized by
-- dealer_subscriptions_select_own_or_admin (own row), and the new COUNT on
-- devices is authorized by the existing devices_select_own_or_admin policy.
--
-- Superseded by dealer_subscriptions_register_device_limit_advisory_lock_fix
-- (next migration): the `for update` row lock used here was found, via live
-- testing, to spuriously return zero rows when combined with RLS on this
-- table -- kept here for accurate migration history, fixed immediately after.

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
    select max_devices_snapshot, status, expires_at
      into v_max_devices, v_status, v_expires_at
      from public.dealer_subscriptions
      where dealer_id = auth.uid()
      for update;

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
