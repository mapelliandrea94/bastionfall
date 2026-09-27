create table if not exists public.completed_matches (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  mode text not null check (mode in ('single-gate', 'tri-gate', 'last-bastion')),
  result_reason text not null check (result_reason in ('bastion-destroyed', 'player-exit')),
  wave integer not null check (wave >= 0),
  elapsed_ms bigint not null check (elapsed_ms >= 0),
  score bigint not null check (score >= 0),
  gold integer not null check (gold >= 0),
  core_hp integer not null check (core_hp >= 0),
  core_max_hp integer not null check (core_max_hp >= 1 and core_hp <= core_max_hp),
  kills bigint not null check (kills >= 0),
  started_at timestamptz not null,
  ended_at timestamptz not null check (ended_at >= started_at),
  created_at timestamptz not null default now()
);

alter table public.completed_matches enable row level security;

revoke all on table public.completed_matches from anon;
revoke all on table public.completed_matches from authenticated;
grant select on table public.completed_matches to authenticated;

drop policy if exists "completed_matches_select_own" on public.completed_matches;
create policy "completed_matches_select_own"
on public.completed_matches
for select
to authenticated
using ((select auth.uid()) = user_id);

create index if not exists completed_matches_user_history_idx
on public.completed_matches (user_id, created_at desc);

create index if not exists completed_matches_mode_history_idx
on public.completed_matches (
  mode,
  wave desc,
  elapsed_ms desc,
  score desc,
  created_at asc
);
