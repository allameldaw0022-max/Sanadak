-- subscription-payment-proofs: mirrors ownership-evidence/report-evidence
-- exactly -- private, folder-scoped by uploader (auth.uid()), no
-- update/delete policy for anyone (append-only evidence; a mistaken upload
-- is superseded by a new request/object, never edited in place).

insert into storage.buckets (id, name, public)
values ('subscription-payment-proofs', 'subscription-payment-proofs', false);

create policy subscription_payment_proofs_insert_own_folder on storage.objects
  for insert with check (
    bucket_id = 'subscription-payment-proofs' and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy subscription_payment_proofs_select_own_or_admin on storage.objects
  for select using (
    bucket_id = 'subscription-payment-proofs'
    and ((storage.foldername(name))[1] = auth.uid()::text or current_user_role() = 'admin')
  );

-- dealer-logos: private (per product decision). Unlike evidence buckets,
-- a logo is not append-only history -- a dealer legitimately wants to
-- replace it, so update/delete are allowed within the uploader's own
-- folder, on top of the same insert/select scoping.

insert into storage.buckets (id, name, public)
values ('dealer-logos', 'dealer-logos', false);

create policy dealer_logos_insert_own_folder on storage.objects
  for insert with check (
    bucket_id = 'dealer-logos' and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy dealer_logos_select_own_or_admin on storage.objects
  for select using (
    bucket_id = 'dealer-logos'
    and ((storage.foldername(name))[1] = auth.uid()::text or current_user_role() = 'admin')
  );

create policy dealer_logos_update_own on storage.objects
  for update using (
    bucket_id = 'dealer-logos' and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy dealer_logos_delete_own on storage.objects
  for delete using (
    bucket_id = 'dealer-logos' and (storage.foldername(name))[1] = auth.uid()::text
  );
