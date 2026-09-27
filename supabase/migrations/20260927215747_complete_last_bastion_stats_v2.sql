alter table public.last_bastion_stats
  add column if not exists wins bigint not null default 0,
  add column if not exists top3 bigint not null default 0,
  add column if not exists best_placement integer;

alter table public.last_bastion_stats
  drop constraint if exists last_bastion_stats_wins_check,
  drop constraint if exists last_bastion_stats_top3_check,
  drop constraint if exists last_bastion_stats_best_placement_check;

alter table public.last_bastion_stats
  add constraint last_bastion_stats_wins_check check (wins >= 0),
  add constraint last_bastion_stats_top3_check check (top3 >= 0),
  add constraint last_bastion_stats_best_placement_check check (best_placement is null or (best_placement between 1 and 8));

alter table public.completed_matches
  drop constraint if exists completed_matches_result_reason_check;

alter table public.completed_matches
  add constraint completed_matches_result_reason_check
  check (result_reason = any (array['bastion-destroyed'::text, 'player-exit'::text, 'last-bastion-win'::text]));

create or replace function public.persist_verified_last_bastion_result_v2(
  p_result_reason text,
  p_wave integer,
  p_elapsed_ms bigint,
  p_score bigint,
  p_gold integer,
  p_core_hp integer,
  p_core_max_hp integer,
  p_kills bigint,
  p_started_at timestamptz,
  p_ended_at timestamptz,
  p_placement integer,
  p_won boolean
)
returns table(
  completed_match_id uuid,
  runs bigint,
  wins bigint,
  top3 bigint,
  best_placement integer,
  best_wave integer,
  best_survival_ms bigint,
  best_score bigint,
  lifetime_kills bigint,
  total_survival_ms bigint
)
language plpgsql
security invoker
set search_path = ''
as $function$
declare
  v_user_id uuid := (select auth.uid());
  v_match_id uuid;
begin
  if v_user_id is null then
    raise exception 'authentication_required';
  end if;

  if p_placement < 1 or p_placement > 8 then
    raise exception 'invalid_placement';
  end if;

  if p_won is distinct from (p_placement = 1) then
    raise exception 'win_placement_mismatch';
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
    user_id, runs, wins, top3, best_placement,
    best_wave, best_survival_ms, best_score, lifetime_kills, total_survival_ms
  )
  values (
    v_user_id, 1,
    case when p_won then 1 else 0 end,
    case when p_placement <= 3 then 1 else 0 end,
    p_placement, p_wave, p_elapsed_ms, p_score, p_kills, p_elapsed_ms
  )
  on conflict (user_id) do update
  set
    runs = public.last_bastion_stats.runs + 1,
    wins = public.last_bastion_stats.wins + excluded.wins,
    top3 = public.last_bastion_stats.top3 + excluded.top3,
    best_placement = case
      when public.last_bastion_stats.best_placement is null then excluded.best_placement
      else least(public.last_bastion_stats.best_placement, excluded.best_placement)
    end,
    best_wave = greatest(public.last_bastion_stats.best_wave, excluded.best_wave),
    best_survival_ms = greatest(public.last_bastion_stats.best_survival_ms, excluded.best_survival_ms),
    best_score = greatest(public.last_bastion_stats.best_score, excluded.best_score),
    lifetime_kills = public.last_bastion_stats.lifetime_kills + excluded.lifetime_kills,
    total_survival_ms = public.last_bastion_stats.total_survival_ms + excluded.total_survival_ms,
    updated_at = now();

  return query
  select v_match_id, lbs.runs, lbs.wins, lbs.top3, lbs.best_placement,
         lbs.best_wave, lbs.best_survival_ms, lbs.best_score,
         lbs.lifetime_kills, lbs.total_survival_ms
  from public.last_bastion_stats lbs
  where lbs.user_id = v_user_id;
end;
$function$;
