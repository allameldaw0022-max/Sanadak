-- Closes a gap found while wiring the free-tier-limit CTA: a regular user
-- who hits their 3-device free cap needs a working path to "اشترك الآن"
-- (subscribe now), but until now only an existing dealer (is_dealer=true,
-- grantable only by an admin via /admin/dealers) could even submit a
-- subscription request -- dealer_subscription_requests_insert_own required
-- current_user_is_dealer(). That made the CTA a dead end for exactly the
-- users it's shown to.
--
-- Fix: becoming a dealer is now the OUTCOME of an admin-approved
-- subscription request, not a precondition for submitting one -- the same
-- self-serve-signup-then-approval pattern already used for the request
-- itself (dealer_subscription_requests already goes through admin review
-- before anything is activated). Any authenticated user may now submit a
-- request for themselves; is_dealer is granted automatically the moment
-- review_subscription_request() approves it. No change to who can review/
-- approve (admin-only, unchanged), and profiles_protect_columns_update
-- still blocks any client-side attempt to set is_dealer directly -- this
-- migration's UPDATE runs inside a SECURITY DEFINER function, which that
-- trigger already exempts (auth.role() would be irrelevant here since the
-- function itself, not a client, performs the write).

drop policy dealer_subscription_requests_insert_own on public.dealer_subscription_requests;
create policy dealer_subscription_requests_insert_own on public.dealer_subscription_requests
  for insert with check (dealer_id = auth.uid());

create or replace function public.review_subscription_request(
  p_request_id uuid,
  p_decision dealer_subscription_request_status,
  p_rejection_reason text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_admin_id uuid := auth.uid();
  v_dealer_id uuid;
  v_plan_id uuid;
  v_max_devices integer;
  v_status dealer_subscription_request_status;
begin
  if v_admin_id is null or public.current_user_role() <> 'admin' then
    raise exception 'غير مصرح: هذا الإجراء متاح للمشرفين فقط.';
  end if;

  if p_decision not in ('approved', 'rejected') then
    raise exception 'قرار غير صالح.';
  end if;

  select dealer_id, plan_id, max_devices_snapshot, status
    into v_dealer_id, v_plan_id, v_max_devices, v_status
    from public.dealer_subscription_requests
    where id = p_request_id
    for update;

  if v_dealer_id is null then
    raise exception 'الطلب غير موجود.';
  end if;

  if v_status <> 'pending' then
    raise exception 'تمت مراجعة هذا الطلب مسبقًا.';
  end if;

  update public.dealer_subscription_requests
    set status = p_decision,
        rejection_reason = case when p_decision = 'rejected' then p_rejection_reason else null end,
        reviewed_by = v_admin_id,
        reviewed_at = now()
    where id = p_request_id;

  if p_decision = 'approved' then
    update public.profiles set is_dealer = true where id = v_dealer_id and is_dealer = false;

    insert into public.dealer_subscriptions (dealer_id, plan_id, max_devices_snapshot, status, started_at, expires_at)
    values (v_dealer_id, v_plan_id, v_max_devices, 'active', now(), now() + interval '30 days')
    on conflict (dealer_id) do update
      set plan_id = excluded.plan_id,
          max_devices_snapshot = excluded.max_devices_snapshot,
          status = 'active',
          started_at = now(),
          expires_at = now() + interval '30 days',
          updated_at = now();

    insert into public.notifications (user_id, type, title, body, related_table, related_id)
    values (
      v_dealer_id,
      'subscription_approved',
      'تم تفعيل اشتراكك',
      'تمت الموافقة على طلب اشتراكك وأصبح فعالاً الآن لمدة 30 يومًا.',
      'dealer_subscription_requests',
      p_request_id
    );
  else
    insert into public.notifications (user_id, type, title, body, related_table, related_id)
    values (
      v_dealer_id,
      'subscription_rejected',
      'تم رفض طلب اشتراكك',
      coalesce(p_rejection_reason, 'تم رفض طلب الاشتراك.'),
      'dealer_subscription_requests',
      p_request_id
    );
  end if;
end;
$$;

revoke execute on function public.review_subscription_request(uuid, dealer_subscription_request_status, text) from anon, public;
grant execute on function public.review_subscription_request(uuid, dealer_subscription_request_status, text) to authenticated;
