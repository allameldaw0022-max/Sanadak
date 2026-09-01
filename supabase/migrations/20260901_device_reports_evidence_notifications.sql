-- Phase 3 remainder (sections 8-11): device reports evidence storage +
-- a minimal in-app notifications system. Purely additive on top of Phase 1
-- (device_reports/report_evidence tables and their RLS already exist and
-- are unchanged) and Phase 2/3. No existing table dropped, no column
-- removed, no existing policy altered.
--
-- device_reports itself needs NO new table/RPC: device_reports_insert_own
-- (Phase 1) already lets an authenticated reporter insert their own report
-- row directly; the app layer (new Server Action) adds the "must currently
-- own this device" business check Phase 1 deliberately left to the
-- application, plus rate limiting.

-- ---------------------------------------------------------------------
-- 1. report-evidence storage bucket, mirroring the ownership-evidence
--    bucket/policies from the Section 7 migration exactly (private,
--    folder-scoped by uploader, no update/delete policy for anyone).
-- ---------------------------------------------------------------------

insert into storage.buckets (id, name, public)
values ('report-evidence', 'report-evidence', false);

create policy report_evidence_bucket_insert_own_folder on storage.objects
  for insert with check (
    bucket_id = 'report-evidence' and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy report_evidence_bucket_select_own_or_admin on storage.objects
  for select using (
    bucket_id = 'report-evidence'
    and ((storage.foldername(name))[1] = auth.uid()::text or current_user_role() = 'admin')
  );

-- ---------------------------------------------------------------------
-- 2. notifications -- minimal in-app notification list. No email: no
--    transactional email sending exists anywhere in this codebase today
--    (Resend/custom SMTP is wired into Supabase Auth only, for its own
--    account emails), and adding one is explicitly out of scope.
-- ---------------------------------------------------------------------

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id),
  type text not null,
  title text not null,
  body text,
  related_table text,
  related_id uuid,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create index notifications_user_id_idx on public.notifications(user_id, created_at desc);

alter table public.notifications enable row level security;

create policy notifications_select_own on public.notifications
  for select using (user_id = auth.uid());

-- Covers the one direct-client-insert path this phase adds (a user
-- self-notifying on their own report submission from the Server Action).
-- Every cross-user notification (e.g. notifying a claimant when an admin
-- reviews their claim) is written from inside a SECURITY DEFINER function
-- below, which bypasses RLS the same way current_user_role() already does
-- -- this policy alone could never let one user notify another.
create policy notifications_insert_own on public.notifications
  for insert with check (user_id = auth.uid());

create policy notifications_update_own on public.notifications
  for update using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- ---------------------------------------------------------------------
-- 3. review_ownership_claim / review_device_report / submit_ownership_claim:
--    same signatures, same authorization, same business logic as before --
--    CREATE OR REPLACE only adds one notification insert each, for the
--    affected user (claimant / reporter), so the lifecycle events in the
--    spec (submitted, more-info-required, approved, rejected) are always
--    recorded regardless of which client called the RPC.
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

  return v_claim_id;
end;
$$;

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
  v_title text;
  v_body text;
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

  v_title := case p_new_status
    when 'UNDER_REVIEW' then 'مطالبتك قيد المراجعة'
    when 'MORE_INFORMATION_REQUIRED' then 'مطلوب معلومات إضافية لمطالبتك'
    when 'APPROVED' then 'تمت الموافقة على مطالبة الملكية'
    when 'REJECTED' then 'تم رفض مطالبة الملكية'
    else null
  end;
  if v_title is not null then
    v_body := case when p_new_status in ('MORE_INFORMATION_REQUIRED', 'REJECTED') then p_note else null end;
    insert into public.notifications (user_id, type, title, body, related_table, related_id)
    values (v_claim.claimant_id, 'claim_' || lower(p_new_status::text), v_title, v_body,
            'ownership_claims', p_claim_id);
  end if;
end;
$$;

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
  v_title text;
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

  v_title := case p_new_status
    when 'UNDER_REVIEW' then 'بلاغك قيد المراجعة'
    when 'APPROVED' then 'تمت الموافقة على بلاغك'
    when 'REJECTED' then 'تم رفض بلاغك'
    else null
  end;
  if v_title is not null then
    insert into public.notifications (user_id, type, title, body, related_table, related_id)
    values (v_report.reporter_id, 'report_' || lower(p_new_status::text), v_title,
            case when p_new_status = 'REJECTED' then p_admin_note else null end,
            'device_reports', p_report_id);
  end if;
end;
$$;
