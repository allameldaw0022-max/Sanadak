-- Phase 4 (sections 12-14): device ownership certificates + QR verification
-- backend, and a minimal dealer flag. Purely additive; no existing table,
-- column, policy, or function altered.

-- ---------------------------------------------------------------------
-- 1. device_certificates -- represents "device X currently belongs to
--    owner Y" at issuance time. Deliberately no separate "status" column:
--    validity is always computed live from the current devices row (see
--    verify_certificate below), so a certificate can never go stale/out of
--    sync with a later ownership transfer or a LOST/STOLEN/BLOCKED report
--    -- there is nothing to remember to update. id is the public identifier
--    used in the QR/verify URL: gen_random_uuid() (122 bits), the same
--    unguessable-id pattern already used for every other primary key in
--    this schema, so no extra token/signing is needed.
-- ---------------------------------------------------------------------

create table public.device_certificates (
  id uuid primary key default gen_random_uuid(),
  device_id uuid not null references public.devices(id) on delete cascade,
  issued_to uuid not null references public.profiles(id),
  issued_at timestamptz not null default now()
);

create index device_certificates_device_id_idx on public.device_certificates(device_id);
create index device_certificates_issued_to_idx on public.device_certificates(issued_to);

alter table public.device_certificates enable row level security;

-- Only the device's CURRENT owner can issue a certificate for it -- checked
-- both here (RLS, the real enforcement) and again in the Server Action for
-- a clear error message, matching this codebase's existing defense-in-depth
-- style.
create policy device_certificates_insert_own_device on public.device_certificates
  for insert with check (
    issued_to = auth.uid()
    and exists (select 1 from public.devices d where d.id = device_id and d.owner_id = auth.uid())
  );

create policy device_certificates_select_own_or_admin on public.device_certificates
  for select using (issued_to = auth.uid() or current_user_role() = 'admin');

-- No update/delete policy for anyone -- immutable, same as the other
-- append-only evidence/history tables in this schema.

-- ---------------------------------------------------------------------
-- 2. verify_certificate -- the ONLY way the public QR-verification page
--    reads anything derived from device_certificates/devices. SECURITY
--    DEFINER on purpose (bypasses RLS to look up a certificate that isn't
--    the caller's own), but the returns table clause only ever names
--    brand/model/issued_at/valid -- no owner, no IMEI, no serial_number, no
--    internal device_id/certificate row beyond the id the caller already
--    has. Returns zero rows for an unknown id (safe not-found, same shape
--    as public_check_device_status).
-- ---------------------------------------------------------------------

create or replace function public.verify_certificate(p_certificate_id uuid)
returns table(brand text, model text, issued_at timestamptz, valid boolean)
language sql
security definer
stable
set search_path = public
as $$
  select d.brand, d.model, c.issued_at,
         (d.owner_id = c.issued_to and d.current_status in ('ACTIVE', 'RECOVERED')) as valid
  from public.device_certificates c
  join public.devices d on d.id = c.device_id
  where c.id = p_certificate_id
  limit 1;
$$;

revoke execute on function public.verify_certificate(uuid) from public;
grant execute on function public.verify_certificate(uuid) to anon, authenticated;

-- ---------------------------------------------------------------------
-- 3. Dealer flag -- a business-entity marker on the existing profiles row,
--    NOT a new role/auth system and NOT a new value added to the existing
--    user_role enum (avoids touching any of the many places that already
--    branch on 'user'/'developer'/'admin'). Defaults to false; only an
--    admin can grant it (profiles_update_own_or_admin, already in place
--    from Phase 1, covers this -- no new policy needed). A dealer keeps
--    exactly their existing 'user' (or whatever) role and permissions,
--    plus access to the batch-IMEI-check surface gated on this flag.
-- ---------------------------------------------------------------------

alter table public.profiles add column is_dealer boolean not null default false;
