-- Core schema bootstrap for Golf Charity Platform
-- Run in Supabase SQL editor (or migration tool) in order.

create extension if not exists "pgcrypto";

create table if not exists public.users (
  id uuid primary key default gen_random_uuid(),
  name text,
  email text unique,
  role text not null default 'subscriber',
  subscription_status text default 'inactive',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.scores (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  score integer not null check (score between 1 and 45),
  date date not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_scores_user_date on public.scores(user_id, date desc);

create table if not exists public.draws (
  id uuid primary key default gen_random_uuid(),
  month integer not null check (month between 1 and 12),
  year integer not null,
  numbers integer[] not null,
  status text not null default 'published',
  created_at timestamptz not null default now()
);

create index if not exists idx_draws_year_month on public.draws(year desc, month desc);

create table if not exists public.winners (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  draw_id uuid not null references public.draws(id) on delete cascade,
  match_type text not null check (match_type in ('3', '4', '5')),
  prize_amount numeric(12,2) not null default 0,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected', 'paid')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_winners_draw on public.winners(draw_id);
create index if not exists idx_winners_status on public.winners(status);

create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references public.users(id) on delete cascade,
  plan text check (plan in ('monthly', 'yearly')),
  status text not null default 'inactive' check (status in ('inactive', 'active', 'canceled', 'expired')),
  start_date timestamptz,
  end_date timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_subscriptions_status on public.subscriptions(status);

create table if not exists public.payment_intents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  plan text not null check (plan in ('monthly', 'yearly')),
  amount numeric(12,2) not null,
  currency text not null default 'USD',
  provider text not null,
  provider_session_id text not null,
  status text not null default 'pending',
  created_at timestamptz not null default now()
);

create index if not exists idx_payment_intents_user on public.payment_intents(user_id, created_at desc);

create table if not exists public.winner_verifications (
  id uuid primary key default gen_random_uuid(),
  winner_id uuid not null references public.winners(id) on delete cascade,
  submitted_by uuid not null references public.users(id) on delete cascade,
  proof_url text not null,
  note text,
  status text not null default 'submitted' check (status in ('submitted', 'approved', 'rejected')),
  reviewed_by uuid references public.users(id),
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_verifications_status on public.winner_verifications(status);

create table if not exists public.charities (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  website_url text,
  logo_url text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.user_charity_preferences (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references public.users(id) on delete cascade,
  charity_id uuid not null references public.charities(id) on delete restrict,
  contribution_percent numeric(5,2) not null default 10 check (contribution_percent >= 10 and contribution_percent <= 100),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
