-- Device verification system (سندك — IMEI platform), Phase 1: backend schema only.
--
-- This migration is purely additive: it creates new tables/functions/policies
-- for a device-registration & IMEI-verification subsystem alongside the
-- existing app-store schema. It does NOT alter, drop, or rename any existing
-- table, column, enum, function, trigger, or policy. profiles/auth/RLS/roles/
-- R2/Resend/Vercel/domain are all untouched. The existing app-store system
-- (apps, reviews, app_reports, subscriptions, payments, security scanning)
-- keeps working exactly as before.
--
-- Scope deliberately excludes (left for a later, separate migration):
--   - dealers / batch IMEI check (explicitly deferred per instructions)
--   - certificates / QR verification codes
--   - the public, rate-limited "check my IMEI" endpoint (that needs a
--     Server Action with rate limiting in front of it — building that without
--     the rate-limiting layer would open an unthrottled enumeration surface,
--     so it is intentionally not wired to anon/authenticated in this pass)
--   - any UI, route, or Server Action (backend/database only, as requested)

-- ---------------------------------------------------------------------
-- 1. Enums
-- ---------------------------------------------------------------------

create type device_status as enum (
  'ACTIVE', 'UNDER_REVIEW', 'LOST', 'STOLEN', 'RECOVERED', 'BLOCKED'
);

create type imei_kind as enum ('imei1', 'imei2');

create type ownership_claim_status as enum (
  'SUBMITTED', 'UNDER_REVIEW', 'MORE_INFORMATION_REQUIRED', 'APPROVED', 'REJECTED'
);

create type device_report_status as enum (
  'SUBMITTED', 'UNDER_REVIEW', 'APPROVED', 'REJECTED'
);

create type device_report_type as enum ('LOST', 'STOLEN');

-- ---------------------------------------------------------------------
-- 2. IMEI validation helper (Luhn checksum, GSMA TS.06) — DB-level defense
--    in depth so a malformed/invalid IMEI can never be stored even if an
--    application-layer check is ever skipped or has a bug.
-- ---------------------------------------------------------------------

create or replace function public.imei_luhn_valid(p_imei text)
returns boolean
language plpgsql
immutable
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

-- ---------------------------------------------------------------------
-- 3. devices
-- ---------------------------------------------------------------------

create table public.devices (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id),
  brand text not null,
  model text not null,
  color text,
  serial_number text,
  current_status device_status not null default 'ACTIVE',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index devices_owner_id_idx on public.devices(owner_id);
create index devices_current_status_idx on public.devices(current_status);

-- serial_number is deliberately NOT unique: unlike IMEI it isn't governed by
-- a global standard, some manufacturers reuse patterns, and users sometimes
-- mistype/duplicate it. It's kept as an informational field for admin manual
-- matching only, never as a trust/uniqueness key.

-- ---------------------------------------------------------------------
-- 4. device_imeis
--    A device-wide UNIQUE constraint on imei_normalized is the mechanism
--    that (a) prevents the same IMEI being registered on two different
--    devices, and (b) as a side effect, makes imei1 = imei2 on the SAME
--    device impossible too (both would need the same unique value).
-- ---------------------------------------------------------------------

create table public.device_imeis (
  id uuid primary key default gen_random_uuid(),
  device_id uuid not null references public.devices(id) on delete cascade,
  imei_normalized text not null,
  imei_hash text not null,
  kind imei_kind not null,
  created_at timestamptz not null default now(),
  constraint device_imeis_imei_normalized_unique unique (imei_normalized),
  constraint device_imeis_device_kind_unique unique (device_id, kind),
  constraint device_imeis_luhn_check check (public.imei_luhn_valid(imei_normalized))
);

create index device_imeis_device_id_idx on public.device_imeis(device_id);
create index device_imeis_imei_hash_idx on public.device_imeis(imei_hash);

-- NOTE for the future registration Server Action: imei_hash MUST be computed
-- server-side (HMAC-SHA256 with a server-only secret) and never trusted from
-- the client. RLS below only enforces ownership, not hash correctness.

-- ---------------------------------------------------------------------
-- 5. device_status_history — immutable, append-only audit trail.
--    No UPDATE/DELETE policy exists for ANY role, admin included: once
--    written, a history row can never be changed. Only the transition
--    RPCs below (running as table owner) can INSERT.
-- ---------------------------------------------------------------------

create table public.device_status_history (
  id uuid primary key default gen_random_uuid(),
  device_id uuid not null references public.devices(id) on delete cascade,
  old_status device_status,
  new_status device_status not null,
  actor_id uuid references public.profiles(id),
  reason text,
  source text not null,
  created_at timestamptz not null default now()
);

create index device_status_history_device_id_idx on public.device_status_history(device_id, created_at desc);

-- ---------------------------------------------------------------------
-- 6. ownership_claims + ownership_evidence
-- ---------------------------------------------------------------------

create table public.ownership_claims (
  id uuid primary key default gen_random_uuid(),
  device_id uuid not null references public.devices(id) on delete cascade,
  claimant_id uuid not null references public.profiles(id),
  status ownership_claim_status not null default 'SUBMITTED',
  note text,
  rejection_reason text,
  reviewed_by uuid references public.profiles(id),
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index ownership_claims_device_id_idx on public.ownership_claims(device_id);
create index ownership_claims_claimant_id_idx on public.ownership_claims(claimant_id);

create table public.ownership_evidence (
  id uuid primary key default gen_random_uuid(),
  claim_id uuid not null references public.ownership_claims(id) on delete cascade,
  uploader_id uuid not null references public.profiles(id),
  storage_path text not null,
  created_at timestamptz not null default now()
);

create index ownership_evidence_claim_id_idx on public.ownership_evidence(claim_id);

-- ---------------------------------------------------------------------
-- 7. device_reports + report_evidence
--    A report's approval does NOT itself flip devices.current_status by
--    trigger — review_device_report() below does both writes in one
--    transaction only when an admin explicitly approves.
-- ---------------------------------------------------------------------

create table public.device_reports (
  id uuid primary key default gen_random_uuid(),
  device_id uuid not null references public.devices(id) on delete cascade,
  reporter_id uuid not null references public.profiles(id),
  report_type device_report_type not null,
  status device_report_status not null default 'SUBMITTED',
  details text,
  admin_note text,
  reviewed_by uuid references public.profiles(id),
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index device_reports_device_id_idx on public.device_reports(device_id);
create index device_reports_reporter_id_idx on public.device_reports(reporter_id);

create table public.report_evidence (
  id uuid primary key default gen_random_uuid(),
  report_id uuid not null references public.device_reports(id) on delete cascade,
  uploader_id uuid not null references public.profiles(id),
  storage_path text not null,
  created_at timestamptz not null default now()
);

create index report_evidence_report_id_idx on public.report_evidence(report_id);

-- ---------------------------------------------------------------------
-- 8. Row Level Security
-- ---------------------------------------------------------------------

alter table public.devices enable row level security;
alter table public.device_imeis enable row level security;
alter table public.device_status_history enable row level security;
alter table public.ownership_claims enable row level security;
alter table public.ownership_evidence enable row level security;
alter table public.device_reports enable row level security;
alter table public.report_evidence enable row level security;

-- devices: owner and admin can read/update their own row. No DELETE policy
-- at all (default-deny) — devices are never deleted through the app.
create policy devices_select_own_or_admin on public.devices
  for select using (owner_id = auth.uid() or current_user_role() = 'admin');

create policy devices_insert_own on public.devices
  for insert with check (owner_id = auth.uid());

create policy devices_update_own_or_admin on public.devices
  for update using (owner_id = auth.uid() or current_user_role() = 'admin')
  with check (owner_id = auth.uid() or current_user_role() = 'admin');
-- current_status and owner_id are further protected below by a trigger that
-- overrides both columns back to their old value regardless of this policy
-- -- this UPDATE policy only governs the non-sensitive columns (brand,
-- model, color, serial_number).

-- device_imeis: owner can read/insert for their own device. No UPDATE/DELETE
-- policy at all — an IMEI, once registered, is immutable through the app;
-- any correction is a deliberate service-role/admin operation outside RLS,
-- not something exposed to a client role.
create policy device_imeis_select_own_or_admin on public.device_imeis
  for select using (
    exists (select 1 from public.devices d where d.id = device_imeis.device_id
            and (d.owner_id = auth.uid() or current_user_role() = 'admin'))
  );

create policy device_imeis_insert_own on public.device_imeis
  for insert with check (
    exists (select 1 from public.devices d where d.id = device_imeis.device_id
            and d.owner_id = auth.uid())
  );

-- device_status_history: SELECT only. No INSERT/UPDATE/DELETE policy for any
-- role — writes happen exclusively inside transition_device_status() below,
-- which runs as the table owner (SECURITY DEFINER) and bypasses RLS the same
-- way handle_new_user() already does for profiles.
create policy device_status_history_select_own_or_admin on public.device_status_history
  for select using (
    current_user_role() = 'admin'
    or exists (select 1 from public.devices d where d.id = device_status_history.device_id and d.owner_id = auth.uid())
  );

-- ownership_claims: claimant, the device's current owner, and admin can see
-- a claim. No UPDATE policy for anyone — every transition goes through
-- review_ownership_claim() below.
create policy ownership_claims_select_related on public.ownership_claims
  for select using (
    claimant_id = auth.uid()
    or current_user_role() = 'admin'
    or exists (select 1 from public.devices d where d.id = ownership_claims.device_id and d.owner_id = auth.uid())
  );

create policy ownership_claims_insert_own on public.ownership_claims
  for insert with check (claimant_id = auth.uid());

-- ownership_evidence: append-only, tied to the claimant's own claim.
create policy ownership_evidence_select_related on public.ownership_evidence
  for select using (
    current_user_role() = 'admin'
    or exists (select 1 from public.ownership_claims c where c.id = ownership_evidence.claim_id and c.claimant_id = auth.uid())
  );

create policy ownership_evidence_insert_own on public.ownership_evidence
  for insert with check (
    uploader_id = auth.uid()
    and exists (select 1 from public.ownership_claims c where c.id = ownership_evidence.claim_id and c.claimant_id = auth.uid())
  );

-- device_reports: reporter must be authenticated (no anonymous stolen/lost
-- reports — higher abuse risk than an app review, so accountability is
-- required). Reporter, the device's owner, and admin can read. No UPDATE
-- policy — only review_device_report() below can transition status.
create policy device_reports_select_related on public.device_reports
  for select using (
    reporter_id = auth.uid()
    or current_user_role() = 'admin'
    or exists (select 1 from public.devices d where d.id = device_reports.device_id and d.owner_id = auth.uid())
  );

create policy device_reports_insert_own on public.device_reports
  for insert with check (reporter_id = auth.uid());

-- report_evidence: append-only, tied to the reporter's own report.
create policy report_evidence_select_related on public.report_evidence
  for select using (
    current_user_role() = 'admin'
    or exists (select 1 from public.device_reports r where r.id = report_evidence.report_id and r.reporter_id = auth.uid())
  );

create policy report_evidence_insert_own on public.report_evidence
  for insert with check (
    uploader_id = auth.uid()
    and exists (select 1 from public.device_reports r where r.id = report_evidence.report_id and r.reporter_id = auth.uid())
  );

-- ---------------------------------------------------------------------
-- 9. devices.current_status / owner_id column protection
--    Same shape as protect_app_review_columns_update: force the sensitive
--    columns back to their prior value unless the write is either a trusted
--    service-role call or came from inside transition_device_status() /
--    review_ownership_claim() (which set a transaction-local flag first).
--    Unlike apps.status, this intentionally has NO "current_user_role() =
--    admin" bypass: even an admin session cannot UPDATE these two columns
--    directly — every change, admin included, must go through the RPCs so
--    a device_status_history row is always written. Nothing UPDATEs these
--    columns directly anywhere in this migration outside those RPCs.
-- ---------------------------------------------------------------------

create or replace function public.protect_device_protected_columns()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.role() = 'service_role' or current_setting('sanadak.allow_device_transition', true) = 'true' then
    return new;
  end if;
  new.current_status := old.current_status;
  new.owner_id := old.owner_id;
  return new;
end;
$$;

create trigger devices_protect_columns_update
  before update on public.devices
  for each row execute function public.protect_device_protected_columns();

create trigger devices_set_updated_at
  before update on public.devices
  for each row execute function public.set_updated_at();

create trigger ownership_claims_set_updated_at
  before update on public.ownership_claims
  for each row execute function public.set_updated_at();

create trigger device_reports_set_updated_at
  before update on public.device_reports
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------
-- 10. Device status state machine
-- ---------------------------------------------------------------------

create or replace function public.is_valid_device_status_transition(p_old device_status, p_new device_status)
returns boolean
language sql
immutable
as $$
  select case p_old
    when 'ACTIVE'       then p_new in ('UNDER_REVIEW', 'LOST', 'STOLEN', 'BLOCKED')
    when 'UNDER_REVIEW'  then p_new in ('ACTIVE', 'LOST', 'STOLEN', 'BLOCKED')
    when 'LOST'          then p_new in ('UNDER_REVIEW', 'RECOVERED', 'STOLEN', 'BLOCKED')
    when 'STOLEN'        then p_new in ('UNDER_REVIEW', 'RECOVERED', 'LOST', 'BLOCKED')
    when 'RECOVERED'     then p_new in ('ACTIVE', 'BLOCKED')
    -- BLOCKED is a strong admin-only state, but not a permanent dead end:
    -- an admin can deliberately reverse a wrong block. Nothing else can.
    when 'BLOCKED'       then p_new in ('ACTIVE', 'UNDER_REVIEW')
    else false
  end;
$$;

create or replace function public.transition_device_status(
  p_device_id uuid,
  p_new_status device_status,
  p_reason text,
  p_source text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_old_status device_status;
begin
  if not (auth.role() = 'service_role' or public.current_user_role() = 'admin') then
    raise exception 'not authorized to transition device status';
  end if;

  select current_status into v_old_status
  from public.devices
  where id = p_device_id
  for update;

  if v_old_status is null then
    raise exception 'device not found';
  end if;

  if v_old_status = p_new_status then
    return;
  end if;

  if not public.is_valid_device_status_transition(v_old_status, p_new_status) then
    raise exception 'invalid device status transition: % -> %', v_old_status, p_new_status;
  end if;

  perform set_config('sanadak.allow_device_transition', 'true', true);
  update public.devices set current_status = p_new_status, updated_at = now() where id = p_device_id;
  perform set_config('sanadak.allow_device_transition', 'false', true);

  insert into public.device_status_history (device_id, old_status, new_status, actor_id, reason, source)
  values (p_device_id, v_old_status, p_new_status, auth.uid(), p_reason, p_source);
end;
$$;

revoke execute on function public.transition_device_status(uuid, device_status, text, text) from public;
grant execute on function public.transition_device_status(uuid, device_status, text, text) to authenticated;

-- ---------------------------------------------------------------------
-- 11. Ownership claim review (admin-only; approval reassigns devices.owner_id
--     through the same protected-column path, and records the change in
--     device_status_history for a single unified device audit trail even
--     though the status itself didn't change).
-- ---------------------------------------------------------------------

create or replace function public.review_ownership_claim(
  p_claim_id uuid,
  p_new_status ownership_claim_status,
  p_note text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_claim public.ownership_claims%rowtype;
begin
  if not (auth.role() = 'service_role' or public.current_user_role() = 'admin') then
    raise exception 'not authorized to review ownership claims';
  end if;

  select * into v_claim from public.ownership_claims where id = p_claim_id for update;
  if v_claim.id is null then
    raise exception 'claim not found';
  end if;

  if v_claim.status in ('APPROVED', 'REJECTED') then
    raise exception 'claim already finalized';
  end if;

  update public.ownership_claims
    set status = p_new_status,
        note = case when p_new_status = 'MORE_INFORMATION_REQUIRED' then p_note else note end,
        rejection_reason = case when p_new_status = 'REJECTED' then p_note else rejection_reason end,
        reviewed_by = auth.uid(),
        reviewed_at = now(),
        updated_at = now()
    where id = p_claim_id;

  if p_new_status = 'APPROVED' then
    perform set_config('sanadak.allow_device_transition', 'true', true);
    update public.devices set owner_id = v_claim.claimant_id, updated_at = now() where id = v_claim.device_id;
    perform set_config('sanadak.allow_device_transition', 'false', true);

    insert into public.device_status_history (device_id, old_status, new_status, actor_id, reason, source)
    select id, current_status, current_status, auth.uid(),
           coalesce(p_note, 'ownership claim approved: owner changed'), 'ownership_claim'
    from public.devices where id = v_claim.device_id;
  end if;
end;
$$;

revoke execute on function public.review_ownership_claim(uuid, ownership_claim_status, text) from public;
grant execute on function public.review_ownership_claim(uuid, ownership_claim_status, text) to authenticated;

-- Evidence uploaded while a claim awaits more information automatically
-- reopens it for review — the claimant never needs (and cannot) set status
-- directly, they can only add evidence.
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
  return new;
end;
$$;

create trigger ownership_evidence_reopen_claim
  after insert on public.ownership_evidence
  for each row execute function public.reopen_claim_after_evidence();

-- ---------------------------------------------------------------------
-- 12. Device report review (admin-only). Approval does not implicitly
--     happen on submission or on a timer — an admin must explicitly call
--     this, and only then does the device's status change, atomically with
--     the report's own status, inside one function.
-- ---------------------------------------------------------------------

create or replace function public.review_device_report(
  p_report_id uuid,
  p_new_status device_report_status,
  p_admin_note text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_report public.device_reports%rowtype;
begin
  if not (auth.role() = 'service_role' or public.current_user_role() = 'admin') then
    raise exception 'not authorized to review device reports';
  end if;

  select * into v_report from public.device_reports where id = p_report_id for update;
  if v_report.id is null then
    raise exception 'report not found';
  end if;

  if v_report.status in ('APPROVED', 'REJECTED') then
    raise exception 'report already finalized';
  end if;

  update public.device_reports
    set status = p_new_status,
        admin_note = coalesce(p_admin_note, admin_note),
        reviewed_by = auth.uid(),
        reviewed_at = now(),
        updated_at = now()
    where id = p_report_id;

  if p_new_status = 'APPROVED' then
    perform public.transition_device_status(
      v_report.device_id,
      case v_report.report_type when 'STOLEN' then 'STOLEN'::device_status else 'LOST'::device_status end,
      p_admin_note,
      'device_report'
    );
  end if;
end;
$$;

revoke execute on function public.review_device_report(uuid, device_report_status, text) from public;
grant execute on function public.review_device_report(uuid, device_report_status, text) to authenticated;
