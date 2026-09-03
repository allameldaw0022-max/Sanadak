-- Makes subscription_plans fully admin-manageable: adds the fields the
-- admin plan-management UI needs (slug, a structured feature list, a
-- "most popular" flag) that the table didn't have yet. Purely additive --
-- no table dropped/recreated, no RLS change (subscription_plans_insert_
-- admin/update_admin/delete_admin/select_active_or_admin already gate
-- exactly as required: admin-only create/update/delete, everyone sees
-- active plans, admin also sees inactive ones), no existing column
-- touched, no data deleted. monthly_price_sdg/max_devices already have
-- CHECK constraints (>= 0 / > 0) from the original migration -- unchanged.
--
-- billing_interval is added (per the requested schema) but constrained to
-- 'monthly' only: the actual subscription duration is computed elsewhere
-- (review_subscription_request(), unchanged here) as a hardcoded 30-day
-- period, so exposing other interval values here would describe behavior
-- the system doesn't actually implement. The column exists so the plan
-- schema is complete and future-proof without pretending to support
-- multi-interval billing today.

alter table public.subscription_plans
  add column slug text,
  add column billing_interval text not null default 'monthly',
  add column features jsonb not null default '[]'::jsonb,
  add column is_popular boolean not null default false;

alter table public.subscription_plans
  add constraint subscription_plans_billing_interval_check check (billing_interval = 'monthly');

alter table public.subscription_plans
  add constraint subscription_plans_features_is_array check (jsonb_typeof(features) = 'array');

-- One-time backfill for the two pre-existing rows so slug can become
-- NOT NULL + UNIQUE below. Keyed by id (not by matching the Arabic name
-- text), idempotent via "where slug is null" -- safe to re-run.
update public.subscription_plans set slug = 'basic' where id = '6f14c759-9b9d-410e-b253-d09f46933075' and slug is null;
update public.subscription_plans set slug = 'advanced' where id = '81349dfc-ae48-41b1-8121-3d204269a42f' and slug is null;
-- Fallback for any other pre-existing row this migration doesn't know
-- about by id (defensive; should not match anything in practice).
update public.subscription_plans set slug = 'plan-' || id::text where slug is null;

-- One-time backfill of the feature list for the two pre-existing rows,
-- so the public plan cards don't render an empty feature list. Every
-- entry here names a real, already-shipped platform capability (using
-- the exact same labels as the homepage's own service tiles, src/app/
-- page.tsx) that a signed-in device owner already has -- nothing
-- invented. Both plans get the identical list: the codebase has no
-- feature gate that differs between the two plans beyond max_devices
-- (already shown separately on each plan card), so there is no genuine
-- "Advanced-only" capability to list. Guarded by "features = '[]'" so a
-- re-run never clobbers a value an admin has since edited via the UI.
update public.subscription_plans set features = '["تسجيل الأجهزة", "توثيق الملكية", "شهادة ملكية", "الإبلاغ عن مفقود/مسروق"]'::jsonb
  where id = '6f14c759-9b9d-410e-b253-d09f46933075' and features = '[]'::jsonb;
update public.subscription_plans set features = '["تسجيل الأجهزة", "توثيق الملكية", "شهادة ملكية", "الإبلاغ عن مفقود/مسروق"]'::jsonb
  where id = '81349dfc-ae48-41b1-8121-3d204269a42f' and features = '[]'::jsonb;

alter table public.subscription_plans
  alter column slug set not null;

alter table public.subscription_plans
  add constraint subscription_plans_slug_unique unique (slug);

alter table public.subscription_plans
  add constraint subscription_plans_slug_format check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$');
