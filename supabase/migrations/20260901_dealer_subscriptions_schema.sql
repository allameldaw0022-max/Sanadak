-- Dealer subscriptions system: brand-new tables, purely additive.
-- Does NOT reuse the legacy `subscriptions` table (developer_id/max_apps/
-- fixed enum plan/no pending-review workflow -- a leftover from the removed
-- app-store product, confirmed unused anywhere in current app code).

create type dealer_subscription_request_status as enum ('pending', 'approved', 'rejected', 'cancelled');
create type dealer_subscription_status as enum ('active', 'expired');

-- Admin-editable plan catalog. Price/limit are never hard-coded in the app --
-- this table is the single source of truth the UI and register_device()
-- both read from (via a snapshot at request time, see below).
create table public.subscription_plans (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  monthly_price_sdg numeric(12,2) not null check (monthly_price_sdg >= 0),
  max_devices integer not null check (max_devices > 0),
  description text,
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Admin-editable bank/payment instructions shown to a dealer during checkout.
-- No real bank data seeded here -- admin fills this in from the dashboard.
create table public.payment_methods (
  id uuid primary key default gen_random_uuid(),
  bank_name text not null,
  account_holder_name text not null,
  account_number text not null,
  iban text,
  phone_or_wallet text,
  instructions text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- The financial/audit record: one append-only row per subscription request.
-- amount_sdg/max_devices_snapshot are frozen at request time so a later
-- admin edit to subscription_plans never rewrites history here.
create table public.dealer_subscription_requests (
  id uuid primary key default gen_random_uuid(),
  dealer_id uuid not null references public.profiles(id) on delete cascade,
  plan_id uuid not null references public.subscription_plans(id),
  amount_sdg numeric(12,2) not null,
  max_devices_snapshot integer not null,
  payment_method_id uuid references public.payment_methods(id),
  payment_proof_path text not null,
  status dealer_subscription_request_status not null default 'pending',
  rejection_reason text,
  reviewed_by uuid references public.profiles(id),
  reviewed_at timestamptz,
  created_at timestamptz not null default now()
);

create index dealer_subscription_requests_dealer_id_idx on public.dealer_subscription_requests(dealer_id);
create index dealer_subscription_requests_status_idx on public.dealer_subscription_requests(status);

-- The single live subscription state per dealer -- what register_device()
-- reads (and row-locks) to enforce the device limit. One row per dealer;
-- approving a new request updates this row in place (renewal/upgrade), the
-- full history stays in dealer_subscription_requests above.
create table public.dealer_subscriptions (
  id uuid primary key default gen_random_uuid(),
  dealer_id uuid not null unique references public.profiles(id) on delete cascade,
  plan_id uuid not null references public.subscription_plans(id),
  max_devices_snapshot integer not null,
  status dealer_subscription_status not null default 'active',
  started_at timestamptz not null default now(),
  expires_at timestamptz not null,
  updated_at timestamptz not null default now()
);

-- Speeds up the per-dealer device count check that register_device() will
-- run on every dealer registration.
create index if not exists devices_owner_id_idx on public.devices(owner_id);

-- Mirrors current_user_role() (already used everywhere in this schema):
-- SECURITY DEFINER + STABLE so RLS policies can call it without recursing
-- back into profiles' own RLS.
create or replace function public.current_user_is_dealer()
returns boolean
language sql
stable security definer
set search_path = public
as $$
  select coalesce((select is_dealer from public.profiles where id = auth.uid()), false);
$$;

alter table public.subscription_plans enable row level security;
alter table public.payment_methods enable row level security;
alter table public.dealer_subscription_requests enable row level security;
alter table public.dealer_subscriptions enable row level security;

-- subscription_plans: anyone signed in sees active plans (marketing-safe,
-- no PII); admin sees everything and is the only writer.
create policy subscription_plans_select_active_or_admin on public.subscription_plans
  for select using (is_active or current_user_role() = 'admin');
create policy subscription_plans_insert_admin on public.subscription_plans
  for insert with check (current_user_role() = 'admin');
create policy subscription_plans_update_admin on public.subscription_plans
  for update using (current_user_role() = 'admin');
create policy subscription_plans_delete_admin on public.subscription_plans
  for delete using (current_user_role() = 'admin');

-- payment_methods: bank details are not public -- only dealers (who need
-- them to pay) and admin can read them.
create policy payment_methods_select_dealer_or_admin on public.payment_methods
  for select using (
    (is_active and current_user_is_dealer()) or current_user_role() = 'admin'
  );
create policy payment_methods_insert_admin on public.payment_methods
  for insert with check (current_user_role() = 'admin');
create policy payment_methods_update_admin on public.payment_methods
  for update using (current_user_role() = 'admin');
create policy payment_methods_delete_admin on public.payment_methods
  for delete using (current_user_role() = 'admin');

-- dealer_subscription_requests: a dealer sees/creates only their own rows;
-- all state transitions (approve/reject) happen exclusively through the
-- review_subscription_request() SECURITY DEFINER RPC (added separately) --
-- no UPDATE policy is granted here at all, admin included.
create policy dealer_subscription_requests_select_own_or_admin on public.dealer_subscription_requests
  for select using (dealer_id = auth.uid() or current_user_role() = 'admin');
create policy dealer_subscription_requests_insert_own on public.dealer_subscription_requests
  for insert with check (dealer_id = auth.uid() and current_user_is_dealer());

-- dealer_subscriptions: read-only to everyone at the RLS layer -- writes
-- happen exclusively through review_subscription_request() (SECURITY
-- DEFINER) and register_device()'s own row lock/read, never a direct
-- client insert/update.
create policy dealer_subscriptions_select_own_or_admin on public.dealer_subscriptions
  for select using (dealer_id = auth.uid() or current_user_role() = 'admin');
