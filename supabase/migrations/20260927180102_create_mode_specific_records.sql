create table if not exists public.mode_records (
  user_id uuid not null references auth.users(id) on delete cascade,
  mode text not null check (mode in ('single-gate', 'tri-gate', 'last-bastion')),
  best_wave integer not null default 0 check (best_wave >= 0),
  best_survival_ms bigint not null default 0 check (best_survival_ms >= 0),
  best_score bigint not null default 0 check (best_score >= 0),
  best_kills bigint not null default 0 check (best_kills >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, mode)
);

alter table public.mode_records enable row level security;

revoke all on table public.mode_records from anon;
revoke all on table public.mode_records from authenticated;
grant select, insert, update on table public.mode_records to authenticated;

drop policy if exists "mode_records_select_own" on public.mode_records;
create policy "mode_records_select_own"
on public.mode_records
for select
to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists "mode_records_insert_own" on public.mode_records;
create policy "mode_records_insert_own"
on public.mode_records
for insert
to authenticated
with check ((select auth.uid()) = user_id);

drop policy if exists "mode_records_update_own" on public.mode_records;
create policy "mode_records_update_own"
on public.mode_records
for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

drop trigger if exists mode_records_set_updated_at on public.mode_records;
create trigger mode_records_set_updated_at
before update on public.mode_records
for each row
execute function bastionfall_internal.set_updated_at();

create index if not exists mode_records_leaderboard_idx
on public.mode_records (
  mode,
  best_wave desc,
  best_survival_ms desc,
  best_score desc,
  updated_at asc
);
