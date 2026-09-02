-- SEC-07: register_device() previously trusted p_imei1_hash/p_imei2_hash as
-- sent by the caller, so any authenticated user hitting the RPC directly
-- (bypassing registerDeviceAction) could submit a hash that doesn't match
-- p_imei1_normalized/p_imei2_normalized. This adds a second, 6-parameter
-- SECURITY DEFINER overload that derives the HMAC itself inside Postgres
-- from the Vault-held secret, so no caller can ever forge imei_hash again.
--
-- The original 8-parameter signature is intentionally left in place here
-- (dropped separately, once the app was confirmed running on this one) so
-- the two coexist during rollout with zero downtime.
CREATE FUNCTION public.register_device(
  p_brand text,
  p_model text,
  p_color text,
  p_serial_number text,
  p_imei1_normalized text,
  p_imei2_normalized text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'pg_catalog', 'public'
AS $function$
declare
  v_device_id uuid;
  v_is_dealer boolean;
  v_max_devices integer;
  v_status dealer_subscription_status;
  v_expires_at timestamptz;
  v_current_count integer;
  v_secret text;
  v_imei1_hash text;
  v_imei2_hash text;
begin
  if auth.uid() is null then
    raise exception 'authentication required';
  end if;

  select is_dealer into v_is_dealer from public.profiles where id = auth.uid();

  if v_is_dealer then
    perform pg_advisory_xact_lock(hashtext(auth.uid()::text)::bigint);
    select max_devices_snapshot, status, expires_at
      into v_max_devices, v_status, v_expires_at
      from public.dealer_subscriptions where dealer_id = auth.uid();
    if v_max_devices is null or v_status <> 'active' or v_expires_at < now() then
      raise exception 'DEALER_NO_SUBSCRIPTION: لا يوجد اشتراك فعال. يرجى الاشتراك أو تجديد الاشتراك أولاً.';
    end if;
    select count(*) into v_current_count from public.devices where owner_id = auth.uid();
    if v_current_count >= v_max_devices then
      raise exception 'DEALER_LIMIT_REACHED: وصلت إلى الحد المسموح به في باقتك.';
    end if;
  else
    perform pg_advisory_xact_lock(hashtext(auth.uid()::text)::bigint);
    select count(*) into v_current_count from public.devices where owner_id = auth.uid();
    if v_current_count >= 3 then
      raise exception 'FREE_LIMIT_REACHED: انتهت الباقة المجانية. يمكنك تسجيل 3 أجهزة مجانًا. للاشتراك وتسجيل أجهزة إضافية، اشترك في باقة التاجر.';
    end if;
  end if;

  select decrypted_secret into v_secret from vault.decrypted_secrets where name = 'imei_hash_secret_v2';
  if v_secret is null then
    raise exception 'IMEI hashing secret is not configured';
  end if;

  v_imei1_hash := encode(extensions.hmac(p_imei1_normalized, v_secret, 'sha256'), 'hex');

  insert into public.devices (owner_id, brand, model, color, serial_number)
  values (auth.uid(), p_brand, p_model, p_color, p_serial_number)
  returning id into v_device_id;

  insert into public.device_imeis (device_id, imei_normalized, imei_hash, kind)
  values (v_device_id, p_imei1_normalized, v_imei1_hash, 'imei1');

  if p_imei2_normalized is not null then
    v_imei2_hash := encode(extensions.hmac(p_imei2_normalized, v_secret, 'sha256'), 'hex');
    insert into public.device_imeis (device_id, imei_normalized, imei_hash, kind)
    values (v_device_id, p_imei2_normalized, v_imei2_hash, 'imei2');
  end if;

  return v_device_id;
end;
$function$;

-- CREATE FUNCTION grants EXECUTE to PUBLIC by default (this project has a
-- default privilege that grants it to anon/authenticated/service_role on
-- creation) -- explicitly lock it down to match the rest of the schema:
-- anon must never be able to call this.
REVOKE ALL ON FUNCTION public.register_device(text,text,text,text,text,text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.register_device(text,text,text,text,text,text) FROM anon;
GRANT EXECUTE ON FUNCTION public.register_device(text,text,text,text,text,text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.register_device(text,text,text,text,text,text) TO service_role;
