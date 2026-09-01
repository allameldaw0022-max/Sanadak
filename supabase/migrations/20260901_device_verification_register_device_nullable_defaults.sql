-- Fix: p_color/p_serial_number had no DEFAULT in register_device(), forcing
-- every caller to pass a value even though the columns themselves are
-- nullable. Add `default null` to match p_imei2_* -- same signature
-- identity (types/order unchanged), just relaxing what's required to call.
-- Also makes p_imei1_normalized/p_imei1_hash explicit-not-null-checked
-- inside the body (they're logically required even though the parameter
-- list itself now defaults everything to null for calling convenience).
create or replace function public.register_device(
  p_brand text,
  p_model text,
  p_color text default null,
  p_serial_number text default null,
  p_imei1_normalized text default null,
  p_imei1_hash text default null,
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

  if p_imei1_normalized is null or p_imei1_hash is null then
    raise exception 'imei1 is required';
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
