-- Payout records and winner status audit trail

create table if not exists public.payout_records (
  id uuid primary key default gen_random_uuid(),
  winner_id uuid not null references public.winners(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  draw_id uuid not null references public.draws(id) on delete cascade,
  amount numeric(12,2) not null default 0,
  currency text not null default 'USD',
  status text not null default 'paid' check (status in ('pending', 'paid', 'failed')),
  reference_code text,
  processed_by uuid references public.users(id),
  processed_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index if not exists idx_payout_records_winner on public.payout_records(winner_id);
create index if not exists idx_payout_records_processed_at on public.payout_records(processed_at desc);

create table if not exists public.winner_status_audit_logs (
  id uuid primary key default gen_random_uuid(),
  winner_id uuid not null references public.winners(id) on delete cascade,
  actor_user_id uuid references public.users(id),
  action text not null,
  from_status text,
  to_status text,
  note text,
  created_at timestamptz not null default now()
);

create index if not exists idx_winner_audit_winner on public.winner_status_audit_logs(winner_id);
create index if not exists idx_winner_audit_created on public.winner_status_audit_logs(created_at desc);
