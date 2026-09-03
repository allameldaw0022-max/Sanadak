-- Admin notifications: an admin-facing "needs review" inbox for the events
-- that already require an admin decision (new ownership claim, new device
-- report, new dealer subscription request, and a claim reopened by fresh
-- evidence after MORE_INFORMATION_REQUIRED).
--
-- Reuses the existing public.notifications table exactly as-is -- one row
-- per active admin, addressed to that admin's own user_id, exactly the
-- same shape as every other notification already written in this schema.
-- notifications_select_own / notifications_update_own (both
-- user_id = auth.uid()) already let each admin read and mark-read only
-- their own copies, and notifications_insert_own (also user_id = auth.uid())
-- already makes it impossible for a client to insert a row addressed to
-- someone else -- so no RLS policy is added, changed, or dropped here.
-- Every admin notification below is written from inside a SECURITY DEFINER
-- function/trigger, the same trusted-path pattern already used for every
-- other cross-user notification in this schema (review_ownership_claim,
-- review_device_report, review_subscription_request). No new table, no
-- new columns, no CASCADE, no data deleted.

-- ---------------------------------------------------------------------
-- 1. New ownership claim -> notify admins.
--    submit_ownership_claim() already returns early (before the
--    ownership_claims insert) when a non-final claim already exists for
--    this device/claimant, so this new insert can only ever run once per
--    actual new claim row -- no duplicate-notification risk, no extra
--    unique constraint needed.
-- ---------------------------------------------------------------------

create or replace function public.submit_ownership_claim(
  p_imei_hash text,
  p_note text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_device_id uuid;
  v_owner_id uuid;
  v_claim_id uuid;
  v_existing_claim_id uuid;
begin
  if auth.uid() is null then
    raise exception 'authentication required';
  end if;

  select di.device_id, d.owner_id into v_device_id, v_owner_id
  from public.device_imeis di
  join public.devices d on d.id = di.device_id
  where di.imei_hash = p_imei_hash
  limit 1;

  if v_device_id is null then
    raise exception 'device not found';
  end if;

  if v_owner_id = auth.uid() then
    raise exception 'already own device';
  end if;

  select id into v_existing_claim_id
  from public.ownership_claims
  where device_id = v_device_id
    and claimant_id = auth.uid()
    and status not in ('APPROVED', 'REJECTED')
  limit 1;

  if v_existing_claim_id is not null then
    return v_existing_claim_id;
  end if;

  insert into public.ownership_claims (device_id, claimant_id, note)
  values (v_device_id, auth.uid(), p_note)
  returning id into v_claim_id;

  insert into public.notifications (user_id, type, title, body, related_table, related_id)
  values (auth.uid(), 'claim_submitted', 'تم استلام مطالبة الملكية',
          'سنقوم بمراجعة مطالبتك وإشعارك بأي تحديث.', 'ownership_claims', v_claim_id);

  insert into public.notifications (user_id, type, title, body, related_table, related_id)
  select id, 'admin_new_claim', 'طلب مطالبة بملكية جديد',
         'يوجد طلب جديد يحتاج إلى مراجعة الإدارة.', 'ownership_claims', v_claim_id
  from public.profiles where role = 'admin';

  return v_claim_id;
end;
$$;

-- ---------------------------------------------------------------------
-- 2. New device report -> notify admins. device_reports has no wrapper
--    RPC on the create path (device_reports_insert_own already lets the
--    reporter insert their own row directly, per Phase 1), so this needs
--    its own AFTER INSERT trigger rather than extending a function.
--    AFTER INSERT fires exactly once per inserted row, so a client retry
--    that produces a genuinely new report row is a genuinely new event
--    (correctly notified again), not a duplicate of the same row.
-- ---------------------------------------------------------------------

create or replace function public.notify_admins_new_device_report()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.notifications (user_id, type, title, body, related_table, related_id)
  select id, 'admin_new_report', 'بلاغ جهاز جديد',
         'تم إرسال بلاغ جديد عن جهاز ويحتاج إلى مراجعة.', 'device_reports', new.id
  from public.profiles where role = 'admin';
  return new;
end;
$$;

create trigger device_reports_notify_admins
  after insert on public.device_reports
  for each row execute function public.notify_admins_new_device_report();

-- ---------------------------------------------------------------------
-- 3. New dealer subscription request -> notify admins. Same reasoning as
--    #2: dealer_subscription_requests_insert_own already lets the dealer
--    insert directly, no wrapper RPC on the create path.
-- ---------------------------------------------------------------------

create or replace function public.notify_admins_new_subscription_request()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.notifications (user_id, type, title, body, related_table, related_id)
  select id, 'admin_new_subscription_request', 'طلب اشتراك تاجر جديد',
         'يوجد طلب اشتراك جديد يحتاج إلى مراجعة.', 'dealer_subscription_requests', new.id
  from public.profiles where role = 'admin';
  return new;
end;
$$;

create trigger dealer_subscription_requests_notify_admins
  after insert on public.dealer_subscription_requests
  for each row execute function public.notify_admins_new_subscription_request();

-- ---------------------------------------------------------------------
-- 4. Claimant attaches more evidence after an admin asked for it -> the
--    claim reopens from MORE_INFORMATION_REQUIRED to UNDER_REVIEW
--    (existing, unchanged business logic) -> notify admins only on that
--    actual reopen (FOUND reflects whether the UPDATE above matched a
--    row), not on every evidence upload -- e.g. the first evidence
--    attached to a brand-new claim, before any admin has reviewed it,
--    must not fire this.
-- ---------------------------------------------------------------------

create or replace function public.reopen_claim_after_evidence()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.ownership_claims
    set status = 'UNDER_REVIEW', updated_at = now()
    where id = new.claim_id and status = 'MORE_INFORMATION_REQUIRED';

  if found then
    insert into public.notifications (user_id, type, title, body, related_table, related_id)
    select id, 'admin_claim_reopened', 'تم إرفاق دليل إضافي',
           'تمت إعادة فتح مطالبة ملكية للمراجعة بعد إرفاق دليل إضافي.', 'ownership_claims', new.claim_id
    from public.profiles where role = 'admin';
  end if;

  return new;
end;
$$;
