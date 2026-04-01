-- Development seed data for Golf Charity Platform

insert into public.users (id, name, email, role, subscription_status)
values
  ('00000000-0000-0000-0000-000000000001', 'Dev Admin', 'dev-admin@example.com', 'admin', 'active')
on conflict (id) do update set
  name = excluded.name,
  email = excluded.email,
  role = excluded.role,
  subscription_status = excluded.subscription_status,
  updated_at = now();

insert into public.charities (name, description, website_url, is_active)
values
  ('Fairway Youth Foundation', 'Grassroots youth golf development and mentoring.', 'https://example.org/fairway-youth', true),
  ('Green Relief Initiative', 'Community environmental restoration and clean water projects.', 'https://example.org/green-relief', true),
  ('Urban Sports Access', 'Inclusive sports programs for underserved communities.', 'https://example.org/urban-sports', true)
on conflict do nothing;

insert into public.subscriptions (user_id, plan, status, start_date, end_date)
values
  (
    '00000000-0000-0000-0000-000000000001',
    'yearly',
    'active',
    now(),
    now() + interval '12 months'
  )
on conflict (user_id) do update set
  plan = excluded.plan,
  status = excluded.status,
  start_date = excluded.start_date,
  end_date = excluded.end_date,
  updated_at = now();
