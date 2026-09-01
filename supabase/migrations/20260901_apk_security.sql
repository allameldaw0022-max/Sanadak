-- APK Security Scanning system
-- Adds an orthogonal security pipeline on top of the existing apps.status
-- (pending/approved/rejected) business-review workflow, WITHOUT changing
-- that enum or any policy that depends on it. Public visibility of an app
-- now requires BOTH the existing business approval AND a passed security
-- scan (see updated apps_select_approved_own_or_admin policy below).

-- ---------------------------------------------------------------------
-- 1. Enums
-- ---------------------------------------------------------------------

create type app_security_status as enum (
  'pending_scan',
  'scanning',
  'passed',
  'review_required',
  'failed'
);

create type security_scan_status as enum (
  'uploaded',
  'scanning',
  'passed',
  'failed',
  'review_required'
);

create type security_risk_level as enum ('low', 'medium', 'high', 'critical');

-- ---------------------------------------------------------------------
-- 2. apps: new security columns
-- ---------------------------------------------------------------------

alter table public.apps
  add column security_status app_security_status not null default 'pending_scan',
  add column apk_sha256 text,
  add column apk_sha1 text,
  add column apk_md5 text,
  add column security_scan_id uuid,
  add column emergency_disabled boolean not null default false,
  add column emergency_disabled_reason text,
  add column emergency_disabled_by uuid references public.profiles(id),
  add column emergency_disabled_at timestamptz;

-- ---------------------------------------------------------------------
-- 3. apk_security_scans
-- ---------------------------------------------------------------------

create table public.apk_security_scans (
  id uuid primary key default gen_random_uuid(),
  app_id uuid not null references public.apps(id) on delete cascade,
  developer_id uuid not null references public.profiles(id),
  file_path text not null,
  sha256 text not null,
  sha1 text,
  md5 text,
  file_size bigint not null,
  package_name text,
  version_name text,
  version_code text,
  min_sdk integer,
  target_sdk integer,
  is_signed boolean not null default false,
  certificate_fingerprint text,
  certificate_subject text,
  certificate_issuer text,
  certificate_valid_from timestamptz,
  certificate_valid_to timestamptz,
  signature_scheme text,
  signature_changed boolean not null default false,
  previous_certificate_fingerprint text,
  permissions jsonb not null default '[]'::jsonb,
  activities jsonb not null default '[]'::jsonb,
  services jsonb not null default '[]'::jsonb,
  receivers jsonb not null default '[]'::jsonb,
  providers jsonb not null default '[]'::jsonb,
  exported_components jsonb not null default '[]'::jsonb,
  deep_links jsonb not null default '[]'::jsonb,
  native_libraries jsonb not null default '[]'::jsonb,
  detected_urls jsonb not null default '[]'::jsonb,
  risk_score integer not null default 0,
  risk_level security_risk_level not null default 'low',
  malware_status text not null default 'not_configured',
  malware_provider text,
  malware_report_id text,
  malware_details jsonb,
  findings jsonb not null default '[]'::jsonb,
  scan_status security_scan_status not null default 'uploaded',
  is_valid_apk boolean not null default false,
  invalid_reason text,
  created_at timestamptz not null default now(),
  completed_at timestamptz
);

alter table public.apps
  add constraint apps_security_scan_id_fkey
  foreign key (security_scan_id) references public.apk_security_scans(id) on delete set null;

create index apk_security_scans_app_id_idx on public.apk_security_scans(app_id);
create index apk_security_scans_developer_id_idx on public.apk_security_scans(developer_id);
create index apk_security_scans_sha256_idx on public.apk_security_scans(sha256);
create index apk_security_scans_package_name_idx on public.apk_security_scans(package_name);

-- ---------------------------------------------------------------------
-- 4. security_events (audit log)
-- ---------------------------------------------------------------------

create table public.security_events (
  id uuid primary key default gen_random_uuid(),
  event_type text not null,
  actor_id uuid references public.profiles(id),
  actor_role text,
  app_id uuid references public.apps(id) on delete set null,
  scan_id uuid references public.apk_security_scans(id) on delete set null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index security_events_app_id_idx on public.security_events(app_id);
create index security_events_created_at_idx on public.security_events(created_at desc);
create index security_events_event_type_idx on public.security_events(event_type);

-- ---------------------------------------------------------------------
-- 5. security_rate_limits (generic fixed-window limiter, service-role only)
-- ---------------------------------------------------------------------

create table public.security_rate_limits (
  key text primary key,
  window_start timestamptz not null default now(),
  count integer not null default 0
);

-- ---------------------------------------------------------------------
-- 6. security_rules_config (admin-editable thresholds, single row)
-- ---------------------------------------------------------------------

create table public.security_rules_config (
  id boolean primary key default true constraint single_row check (id),
  config jsonb not null,
  updated_by uuid references public.profiles(id),
  updated_at timestamptz not null default now()
);

insert into public.security_rules_config (id, config) values (
  true,
  '{
    "riskThresholds": {"low": 20, "medium": 50, "high": 80},
    "highRiskPermissions": [
      "android.permission.READ_SMS", "android.permission.SEND_SMS",
      "android.permission.RECEIVE_SMS", "android.permission.CALL_PHONE",
      "android.permission.PROCESS_OUTGOING_CALLS", "android.permission.BIND_ACCESSIBILITY_SERVICE",
      "android.permission.BIND_DEVICE_ADMIN", "android.permission.SYSTEM_ALERT_WINDOW",
      "android.permission.REQUEST_INSTALL_PACKAGES", "android.permission.WRITE_SECURE_SETTINGS",
      "android.permission.READ_CALL_LOG", "android.permission.WRITE_CALL_LOG"
    ]
  }'::jsonb
);

-- ---------------------------------------------------------------------
-- 7. RLS: apk_security_scans, security_events, security_rules_config
--    (no INSERT/UPDATE/DELETE policy for anon/authenticated on any of
--    these -> RLS default-denies those commands; only a service-role
--    key, used exclusively in trusted server code, can write.)
-- ---------------------------------------------------------------------

alter table public.apk_security_scans enable row level security;
alter table public.security_events enable row level security;
alter table public.security_rate_limits enable row level security;
alter table public.security_rules_config enable row level security;

create policy apk_security_scans_select_own_or_admin on public.apk_security_scans
  for select using (developer_id = auth.uid() or current_user_role() = 'admin');

create policy security_events_select_own_or_admin on public.security_events
  for select using (
    current_user_role() = 'admin'
    or exists (select 1 from public.apps a where a.id = security_events.app_id and a.developer_id = auth.uid())
  );

create policy security_rules_config_select_admin on public.security_rules_config
  for select using (current_user_role() = 'admin');

-- security_rate_limits has no policies at all: never readable/writable by
-- anon/authenticated, only by the service-role key.

-- ---------------------------------------------------------------------
-- 8. Column-level protection on apps: security_* / emergency_* fields can
--    only be changed by an admin session or the service-role key, no
--    matter what a client sends in an INSERT/UPDATE payload.
-- ---------------------------------------------------------------------

create or replace function public.protect_app_security_columns_insert()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.role() = 'service_role' or current_user_role() = 'admin' then
    return new;
  end if;
  new.security_status := 'pending_scan';
  new.apk_sha256 := null;
  new.apk_sha1 := null;
  new.apk_md5 := null;
  new.security_scan_id := null;
  new.emergency_disabled := false;
  new.emergency_disabled_reason := null;
  new.emergency_disabled_by := null;
  new.emergency_disabled_at := null;
  return new;
end;
$$;

create or replace function public.protect_app_security_columns_update()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.role() = 'service_role' or current_user_role() = 'admin' then
    return new;
  end if;
  new.security_status := old.security_status;
  new.apk_sha256 := old.apk_sha256;
  new.apk_sha1 := old.apk_sha1;
  new.apk_md5 := old.apk_md5;
  new.security_scan_id := old.security_scan_id;
  new.emergency_disabled := old.emergency_disabled;
  new.emergency_disabled_reason := old.emergency_disabled_reason;
  new.emergency_disabled_by := old.emergency_disabled_by;
  new.emergency_disabled_at := old.emergency_disabled_at;
  return new;
end;
$$;

create trigger apps_protect_security_columns_insert
  before insert on public.apps
  for each row execute function public.protect_app_security_columns_insert();

create trigger apps_protect_security_columns_update
  before update on public.apps
  for each row execute function public.protect_app_security_columns_update();

-- ---------------------------------------------------------------------
-- 9. Public visibility gate: an app is only visible to the public once
--    it has BOTH business approval (status) AND a passed security scan,
--    and is not under an emergency block. Owner and admin still see it
--    regardless (unchanged from before), so the developer/admin UI keeps
--    working exactly as it did.
-- ---------------------------------------------------------------------

drop policy apps_select_approved_own_or_admin on public.apps;

create policy apps_select_approved_own_or_admin on public.apps
  for select using (
    (status = 'approved' and security_status = 'passed' and emergency_disabled = false)
    or developer_id = auth.uid()
    or current_user_role() = 'admin'
  );
