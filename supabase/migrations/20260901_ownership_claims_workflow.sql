-- Phase 3, section 7: Ownership Claims (user-facing submission flow only --
-- admin review already exists via review_ownership_claim() from Phase 1).
-- Purely additive on top of Phase 1's ownership_claims/ownership_evidence
-- tables. No existing table's columns changed, no app-store table touched.

-- ---------------------------------------------------------------------
-- 1. submit_ownership_claim: the ONLY way a client can create a claim.
--
--    A claimant identifies the device by IMEI (not device_id -- device_id
--    is never exposed to any client, matching the Phase 2 design where
--    public_check_device_status also never returns it). This function
--    receives only imei_hash (computed server-side by the caller, same
--    as every other IMEI-hash consumer), resolves it to a device_id
--    itself (SECURITY DEFINER, bypassing the owner/admin-only RLS on
--    devices/device_imeis for this one lookup), and inserts the claim.
--
--    Deliberate, documented trade-off: unlike the public IMEI check,
--    this DOES reveal to the (authenticated, rate-limited, logged) caller
--    whether a given IMEI is registered at all, because a claim is
--    meaningless against a device that doesn't exist. This is judged
--    acceptable specifically because the caller must be authenticated
--    (accountable identity, unlike the anonymous public check) --
--    the same reasoning device_reports already relies on. It is not an
--    oversight; see src/app/devices/claims/actions.ts for the matching
--    rate-limit + progressive-delay + audit-logging layer.
--
--    Idempotent by design: a second submission for the same device by the
--    same claimant, while an earlier claim is still open, returns the
--    existing open claim's id instead of erroring or duplicating rows.
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

  return v_claim_id;
end;
$$;

revoke execute on function public.submit_ownership_claim(text, text) from anon, public;
grant execute on function public.submit_ownership_claim(text, text) to authenticated;

-- ---------------------------------------------------------------------
-- 2. devices: minimal, narrow RLS extension so a claimant can see basic
--    info (brand/model/color/current_status) for a device they've filed
--    a claim on -- otherwise the Phase 1 owner/admin-only SELECT policy
--    would make "track your claim" show nothing to look at. owner_id is
--    still readable by this policy at the row level (Postgres RLS is
--    row-, not column-, scoped) but the application layer never selects
--    or displays it for a claimant who isn't the owner -- see
--    getMyClaimById in queries.ts, which explicitly omits it.
-- ---------------------------------------------------------------------

create policy devices_select_claimant on public.devices
  for select using (
    exists (
      select 1 from public.ownership_claims c
      where c.device_id = devices.id and c.claimant_id = auth.uid()
    )
  );

-- ---------------------------------------------------------------------
-- 3. Private storage bucket for ownership evidence, mirroring the
--    existing payment-proofs bucket's RLS shape (folder-scoped by
--    auth.uid()), but files are only ever written through
--    submitClaimEvidenceAction after real server-side magic-byte
--    validation (the STRONGER of the two existing upload patterns in
--    this codebase -- app-icons/app_screenshots, not the weaker
--    client-direct-upload payment-proofs pattern), never trusted from a
--    client-supplied MIME type. No UPDATE/DELETE policy at all: evidence
--    is append-only once submitted, matching device_status_history's
--    immutability philosophy.
-- ---------------------------------------------------------------------

insert into storage.buckets (id, name, public)
values ('ownership-evidence', 'ownership-evidence', false);

create policy ownership_evidence_insert_own_folder on storage.objects
  for insert with check (
    bucket_id = 'ownership-evidence' and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy ownership_evidence_select_own_or_admin on storage.objects
  for select using (
    bucket_id = 'ownership-evidence'
    and ((storage.foldername(name))[1] = auth.uid()::text or current_user_role() = 'admin')
  );
