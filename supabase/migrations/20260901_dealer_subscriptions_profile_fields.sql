-- Dealer business-profile fields on the existing profiles row. No new RLS
-- needed: profiles_update_own_or_admin already lets a user update their own
-- row, and profiles_protect_columns_update (existing trigger) already forces
-- role/is_dealer back to their prior value on any non-admin update -- these
-- new columns are outside that trigger's protected set, so a dealer can
-- freely edit their own business info while role/is_dealer stay locked down.

alter table public.profiles
  add column business_name text,
  add column contact_name text,
  add column phone text,
  add column address text,
  add column logo_path text;
