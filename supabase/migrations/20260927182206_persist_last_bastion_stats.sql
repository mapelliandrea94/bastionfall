create table if not exists public.last_bastion_stats (
  user_id uuid primary key references auth.users(id) on delete cascade,
  runs bigint not null default 0 check (runs >= 0),
  best_wave integer not null default 0 check (best_wave >= 0),
  best_survival_ms bigint not null default 0 check (best_survival_ms >= 0),
  best_score bigint not null default 0 check (best_score >= 0),
  lifetime_kills bigint not null default 0 check (lifetime_kills >= 0),
  total_survival_ms bigint not null default 0 check (total_survival_ms >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.last_bastion_stats enable row level security;

revoke all on table public.last_bastion_stats from anon;
revoke all on table public.last_bastion_stats from authenticated;
grant select, insert, update on table public.last_bastion_stats to authenticated;

drop policy if exists "last_bastion_stats_select_own" on public.last_bastion_stats;
create policy "last_bastion_stats_select_own"
on public.last_bastion_stats
for select
to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists "last_bastion_stats_insert_server" on public.last_bastion_stats;
create policy "last_bastion_stats_insert_server"
on public.last_bastion_stats
for insert
to authenticated
with check (
  (select auth.uid()) = user_id
  and (select public.bastionfall_server_write_allowed())
);

drop policy if exists "last_bastion_stats_update_server" on public.last_bastion_stats;
create policy "last_bastion_stats_update_server"
on public.last_bastion_stats
for update
to authenticated
using (
  (select auth.uid()) = user_id
  and (select public.bastionfall_server_write_allowed())
)
with check (
  (select auth.uid()) = user_id
  and (select public.bastionfall_server_write_allowed())
);

drop trigger if exists last_bastion_stats_set_updated_at on public.last_bastion_stats;
create trigger last_bastion_stats_set_updated_at
before update on public.last_bastion_stats
for each row
execute function bastionfall_internal.set_updated_at();

create or replace function public.persist_verified_last_bastion_result(
  p_result_reason text,
  p_wave integer,
  p_elapsed_ms bigint,
  p_score bigint,
  p_gold integer,
  p_core_hp integer,
  p_core_max_hp integer,
  p_kills bigint,
  p_started_at timestamptz,
  p_ended_at timestamptz
)
returns table (
  completed_match_id uuid,
  runs bigint,
  best_wave integer,
  best_survival_ms bigint,
  best_score bigint,
  lifetime_kills bigint,
  total_survival_ms bigint
)
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_user_id uuid := (select auth.uid());
  v_match_id uuid;
begin
  if v_user_id is null then
    raise exception 'authentication_required';
  end if;

  insert into public.completed_matches (
    user_id, mode, result_reason, wave, elapsed_ms, score, gold,
    core_hp, core_max_hp, kills, started_at, ended_at
  )
  values (
    v_user_id, 'last-bastion', p_result_reason, p_wave, p_elapsed_ms, p_score, p_gold,
    p_core_hp, p_core_max_hp, p_kills, p_started_at, p_ended_at
  )
  returning id into v_match_id;

  insert into public.last_bastion_stats (
    user_id, runs, best_wave, best_survival_ms, best_score, lifetime_kills, total_survival_ms
  )
  values (
    v_user_id, 1, p_wave, p_elapsed_ms, p_score, p_kills, p_elapsed_ms
  )
  on conflict (user_id) do update
  set
    runs = public.last_bastion_stats.runs + 1,
    best_wave = greatest(public.last_bastion_stats.best_wave, excluded.best_wave),
    best_survival_ms = greatest(public.last_bastion_stats.best_survival_ms, excluded.best_survival_ms),
    best_score = greatest(public.last_bastion_stats.best_score, excluded.best_score),
    lifetime_kills = public.last_bastion_stats.lifetime_kills + excluded.lifetime_kills,
    total_survival_ms = public.last_bastion_stats.total_survival_ms + excluded.total_survival_ms;

  return query
  select
    v_match_id,
    lbs.runs,
    lbs.best_wave,
    lbs.best_survival_ms,
    lbs.best_score,
    lbs.lifetime_kills,
    lbs.total_survival_ms
  from public.last_bastion_stats lbs
  where lbs.user_id = v_user_id;
end;
$$;

revoke all on function public.persist_verified_last_bastion_result(
  text, integer, bigint, bigint, integer, integer, integer, bigint, timestamptz, timestamptz
) from public;
revoke all on function public.persist_verified_last_bastion_result(
  text, integer, bigint, bigint, integer, integer, integer, bigint, timestamptz, timestamptz
) from anon;
grant execute on function public.persist_verified_last_bastion_result(
  text, integer, bigint, bigint, integer, integer, integer, bigint, timestamptz, timestamptz
) to authenticated;
