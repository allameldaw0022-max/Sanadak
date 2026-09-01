-- Admin approve/reject for a dealer subscription request. Same pattern as
-- review_ownership_claim/review_device_report: SECURITY DEFINER (must write
-- dealer_subscriptions and notifications, neither of which grants a direct
-- client UPDATE/INSERT), with an explicit role check inside the function
-- body as the actual authorization -- RLS on the tables it touches is
-- deliberately locked down to nothing for non-definer callers, so this
-- function is the ONLY path any decision can be made through.
--
-- Superseded by dealer_subscription_self_serve_signup (later migration),
-- which adds the is_dealer auto-grant on approval -- kept here for accurate
-- migration history.

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
