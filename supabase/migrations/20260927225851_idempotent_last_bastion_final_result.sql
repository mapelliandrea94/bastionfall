alter table public.completed_matches
  add column if not exists last_bastion_match_id uuid null
  references public.last_bastion_matches(id) on delete set null;

create unique index if not exists completed_matches_last_bastion_user_match_uidx
  on public.completed_matches(user_id, last_bastion_match_id)
  where last_bastion_match_id is not null;

create or replace function public.persist_verified_last_bastion_result_v3(
  p_match_id uuid,
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
  wins bigint,
  top3 bigint,
  best_placement integer,
  best_wave integer,
  best_survival_ms bigint,
  best_score bigint,
  lifetime_kills bigint,
  total_survival_ms bigint,
  already_recorded boolean
)
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_user_id uuid := (select auth.uid());
  v_match_status text;
  v_match_started_at timestamptz;
  v_match_ended_at timestamptz;
  v_winner_user_id uuid;
  v_placement integer;
  v_won boolean;
  v_expected_reason text;
  v_completed_match_id uuid;
  v_inserted boolean := false;
begin
  if v_user_id is null then raise exception 'authentication_required'; end if;
  if not public.bastionfall_server_write_allowed() then raise exception 'server_authorization_required'; end if;

  select m.status, m.started_at, m.ended_at, m.winner_user_id, p.placement
  into v_match_status, v_match_started_at, v_match_ended_at, v_winner_user_id, v_placement
  from public.last_bastion_matches m
  join public.last_bastion_participants p on p.match_id=m.id and p.user_id=v_user_id
  where m.id=p_match_id;

  if not found then raise exception 'last_bastion_match_not_found'; end if;
  if v_match_status <> 'finished' or v_match_ended_at is null then raise exception 'last_bastion_match_not_finished'; end if;
  if v_placement is null or v_placement < 1 or v_placement > 8 then raise exception 'last_bastion_placement_missing'; end if;

  v_won := v_winner_user_id = v_user_id;
  if v_won is distinct from (v_placement = 1) then raise exception 'win_placement_mismatch'; end if;

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

    v_inserted := true;
  end if;

  return query
  select v_completed_match_id,lbs.runs,lbs.wins,lbs.top3,lbs.best_placement,lbs.best_wave,lbs.best_survival_ms,
         lbs.best_score,lbs.lifetime_kills,lbs.total_survival_ms,not v_inserted
  from public.last_bastion_stats lbs where lbs.user_id=v_user_id;
end;
$$;

revoke all on function public.persist_verified_last_bastion_result_v3(
  uuid,text,integer,bigint,bigint,integer,integer,integer,bigint,timestamptz,timestamptz
) from public, anon;
grant execute on function public.persist_verified_last_bastion_result_v3(
  uuid,text,integer,bigint,bigint,integer,integer,integer,bigint,timestamptz,timestamptz
) to authenticated;
