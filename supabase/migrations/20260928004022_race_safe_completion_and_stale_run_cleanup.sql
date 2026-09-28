CREATE OR REPLACE FUNCTION public.persist_verified_last_bastion_result_v3(p_match_id uuid, p_result_reason text, p_wave integer, p_elapsed_ms bigint, p_score bigint, p_gold integer, p_core_hp integer, p_core_max_hp integer, p_kills bigint, p_started_at timestamp with time zone, p_ended_at timestamp with time zone)
 RETURNS TABLE(completed_match_id uuid, runs bigint, wins bigint, top3 bigint, best_placement integer, best_wave integer, best_survival_ms bigint, best_score bigint, lifetime_kills bigint, total_survival_ms bigint, already_recorded boolean, earned_shards integer)
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
declare
  v_user_id uuid := (select auth.uid());
  v_match_status text;
  v_match_started_at timestamptz;
  v_match_ended_at timestamptz;
  v_winner_user_id uuid;
  v_placement integer;
  v_reported_wave integer;
  v_reported_core_hp integer;
  v_won boolean;
  v_expected_reason text;
  v_completed_match_id uuid;
  v_inserted boolean := false;
  v_shards integer := greatest(1, floor(p_wave::numeric / 2)::integer);
begin
  if v_user_id is null then raise exception 'authentication_required'; end if;
  if not public.bastionfall_server_write_allowed() then raise exception 'server_authorization_required'; end if;

  select m.status, m.started_at, m.ended_at, m.winner_user_id, p.placement, p.wave, p.core_hp
  into v_match_status, v_match_started_at, v_match_ended_at, v_winner_user_id, v_placement, v_reported_wave, v_reported_core_hp
  from public.last_bastion_matches m
  join public.last_bastion_participants p on p.match_id=m.id and p.user_id=v_user_id
  where m.id=p_match_id
  for update of m, p;

  if not found then raise exception 'last_bastion_match_not_found'; end if;
  if v_match_status <> 'finished' or v_match_ended_at is null then raise exception 'last_bastion_match_not_finished'; end if;
  if v_placement is null or v_placement < 1 or v_placement > 8 then raise exception 'last_bastion_placement_missing'; end if;

  v_won := v_winner_user_id = v_user_id;
  if v_won is distinct from (v_placement = 1) then raise exception 'win_placement_mismatch'; end if;
  if p_core_max_hp < 1 or p_core_max_hp > 28 then raise exception 'last_bastion_core_max_hp_invalid'; end if;

  if v_won then
    if p_wave < v_reported_wave or p_wave > v_reported_wave + 1 then
      raise exception 'last_bastion_wave_mismatch';
    end if;
  else
    if p_wave is distinct from v_reported_wave then raise exception 'last_bastion_wave_mismatch'; end if;
    if p_core_hp is distinct from v_reported_core_hp or p_core_hp <> 0 then
      raise exception 'last_bastion_core_hp_mismatch';
    end if;
  end if;

  v_expected_reason := case when v_won then 'last-bastion-win' else 'bastion-destroyed' end;
  if p_result_reason is distinct from v_expected_reason then raise exception 'last_bastion_result_mismatch'; end if;
  if p_started_at is distinct from v_match_started_at then raise exception 'last_bastion_started_at_mismatch'; end if;
  if p_ended_at < v_match_started_at or p_ended_at > v_match_ended_at + interval '15 seconds' then
    raise exception 'last_bastion_ended_at_mismatch';
  end if;

  select cm.id into v_completed_match_id
  from public.completed_matches cm
  where cm.user_id=v_user_id and cm.last_bastion_match_id=p_match_id
  limit 1;

  if v_completed_match_id is null then
    insert into public.completed_matches (
      user_id,mode,result_reason,wave,elapsed_ms,score,gold,core_hp,core_max_hp,kills,started_at,ended_at,last_bastion_match_id
    ) values (
      v_user_id,'last-bastion',p_result_reason,p_wave,p_elapsed_ms,p_score,p_gold,p_core_hp,p_core_max_hp,p_kills,p_started_at,p_ended_at,p_match_id
    ) returning id into v_completed_match_id;

    insert into public.last_bastion_stats (
      user_id,runs,wins,top3,best_placement,best_wave,best_survival_ms,best_score,lifetime_kills,total_survival_ms
    ) values (
      v_user_id,1,case when v_won then 1 else 0 end,case when v_placement<=3 then 1 else 0 end,
      v_placement,p_wave,p_elapsed_ms,p_score,p_kills,p_elapsed_ms
    )
    on conflict (user_id) do update set
      runs=public.last_bastion_stats.runs+1,
      wins=public.last_bastion_stats.wins+excluded.wins,
      top3=public.last_bastion_stats.top3+excluded.top3,
      best_placement=case when public.last_bastion_stats.best_placement is null then excluded.best_placement else least(public.last_bastion_stats.best_placement,excluded.best_placement) end,
      best_wave=greatest(public.last_bastion_stats.best_wave,excluded.best_wave),
      best_survival_ms=greatest(public.last_bastion_stats.best_survival_ms,excluded.best_survival_ms),
      best_score=greatest(public.last_bastion_stats.best_score,excluded.best_score),
      lifetime_kills=public.last_bastion_stats.lifetime_kills+excluded.lifetime_kills,
      total_survival_ms=public.last_bastion_stats.total_survival_ms+excluded.total_survival_ms,
      updated_at=now();

    update public.profiles
    set best_wave = greatest(coalesce(best_wave,0), p_wave),
        shards = coalesce(shards,0) + v_shards,
        runs = coalesce(runs,0) + 1,
        lifetime_kills = coalesce(lifetime_kills,0) + p_kills,
        updated_at = now()
    where user_id = v_user_id;

    if not found then
      raise exception 'profile_missing';
    end if;

    v_inserted := true;
  end if;

  return query
  select v_completed_match_id,lbs.runs,lbs.wins,lbs.top3,lbs.best_placement,lbs.best_wave,lbs.best_survival_ms,
         lbs.best_score,lbs.lifetime_kills,lbs.total_survival_ms,not v_inserted,
         case when v_inserted then v_shards else 0 end
  from public.last_bastion_stats lbs where lbs.user_id=v_user_id;
end;
$function$;

CREATE OR REPLACE FUNCTION public.abandon_stale_standard_runs_for_user(p_now timestamp with time zone DEFAULT now(), p_timeout_seconds integer DEFAULT 21600)
 RETURNS integer
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
declare
  v_user_id uuid := (select auth.uid());
  v_timeout integer := greatest(coalesce(p_timeout_seconds,21600),3600);
  v_count integer := 0;
begin
  if v_user_id is null then raise exception 'authentication_required'; end if;
  if not public.bastionfall_server_write_allowed() then raise exception 'server_authorization_required'; end if;
  if p_now is null then raise exception 'invalid_now'; end if;

  update public.standard_run_sessions
  set status='abandoned',
      completed_at=coalesce(completed_at,p_now),
      updated_at=p_now
  where user_id=v_user_id
    and status='active'
    and last_reported_at < p_now - make_interval(secs => v_timeout);

  get diagnostics v_count = row_count;
  return v_count;
end;
$function$;

revoke all on function public.abandon_stale_standard_runs_for_user(timestamptz,integer) from public, anon;
grant execute on function public.abandon_stale_standard_runs_for_user(timestamptz,integer) to authenticated;
