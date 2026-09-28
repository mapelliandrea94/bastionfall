drop function if exists public.persist_verified_standard_result_v2(
  uuid,text,text,integer,bigint,bigint,integer,integer,integer,bigint,timestamptz,timestamptz
);

drop function if exists public.persist_verified_standard_result_v3(
  uuid,text,text,bigint,bigint,integer,integer,integer,timestamptz,timestamptz
);

create or replace function public.persist_verified_standard_result_v3(
  p_match_id uuid,
  p_mode text,
  p_result_reason text,
  p_gold integer,
  p_core_hp integer,
  p_core_max_hp integer,
  p_started_at timestamptz,
  p_ended_at timestamptz
)
returns table(
  completed_match_id uuid,
  best_wave integer,
  best_survival_ms bigint,
  best_score bigint,
  best_kills bigint,
  already_recorded boolean,
  earned_shards integer,
  canonical_wave integer,
  canonical_kills bigint,
  canonical_elapsed_ms bigint,
  canonical_score bigint
)
language plpgsql
security invoker
set search_path=''
as $$
declare
  v_user_id uuid := (select auth.uid());
  v_session public.standard_run_sessions%rowtype;
  v_completed_match_id uuid;
  v_inserted boolean := false;
  v_shards integer;
  v_ledger_kills bigint := 0;
  v_result_reason text;
  v_elapsed_ms bigint;
  v_score bigint;
  v_flawless_bonus bigint;
begin
  if v_user_id is null then raise exception 'authentication_required'; end if;
  if not public.bastionfall_server_write_allowed() then raise exception 'server_authorization_required'; end if;
  if p_mode not in ('single-gate','tri-gate') then raise exception 'invalid_mode'; end if;

  select * into v_session
  from public.standard_run_sessions
  where match_id=p_match_id
  for update;

  if not found then raise exception 'run_checkpoint_missing'; end if;
  if v_session.user_id <> v_user_id then raise exception 'match_user_mismatch'; end if;
  if v_session.mode <> p_mode or v_session.started_at <> p_started_at then raise exception 'match_identity_mismatch'; end if;

  select id into v_completed_match_id
  from public.completed_matches
  where standard_run_match_id=p_match_id
  limit 1;

  if v_completed_match_id is not null then
    return query
    select v_completed_match_id,mr.best_wave,mr.best_survival_ms,mr.best_score,mr.best_kills,true,0,
           cm.wave,cm.kills,cm.elapsed_ms,cm.score
    from public.mode_records mr
    join public.completed_matches cm on cm.id=v_completed_match_id
    where mr.user_id=v_user_id and mr.mode=p_mode;
    return;
  end if;

  if v_session.status <> 'active' then raise exception 'run_not_active'; end if;
  if v_session.last_core_max_hp < 1 or v_session.last_core_max_hp > 28
     or v_session.last_core_hp < 0 or v_session.last_core_hp > v_session.last_core_max_hp then
    raise exception 'invalid_core_state';
  end if;

  select coalesce(sum(claimed_kills),0)::bigint
    into v_ledger_kills
  from public.standard_run_wave_kills
  where match_id=p_match_id;

  if v_ledger_kills <> v_session.last_kills then raise exception 'kill_ledger_mismatch'; end if;

  if p_gold <> v_session.last_gold then raise exception 'final_gold_checkpoint_mismatch'; end if;
  if p_core_hp <> v_session.last_core_hp or p_core_max_hp <> v_session.last_core_max_hp then
    raise exception 'final_core_checkpoint_mismatch';
  end if;

  v_result_reason := case when v_session.last_core_hp = 0 then 'bastion-destroyed' else 'player-exit' end;
  if p_result_reason <> v_result_reason then raise exception 'final_result_reason_mismatch'; end if;

  if p_ended_at is null or p_ended_at < v_session.started_at then raise exception 'invalid_canonical_end_time'; end if;
  if p_ended_at <> v_session.last_reported_at then raise exception 'canonical_end_time_mismatch'; end if;

  v_elapsed_ms := floor(extract(epoch from (p_ended_at - v_session.started_at)) * 1000)::bigint;
  v_flawless_bonus := case when v_session.last_core_hp >= v_session.last_core_max_hp then 500 else 0 end;
  v_score :=
      (v_session.last_wave::bigint * 1000)
    + ((v_elapsed_ms / 1000) * 5)
    + (v_ledger_kills * 25)
    + round(v_session.last_core_hp::numeric * 40)::bigint
    + v_flawless_bonus;

  v_shards := greatest(1, floor(v_session.last_wave::numeric / 2)::integer);

  insert into public.completed_matches(
    user_id,mode,result_reason,wave,elapsed_ms,score,gold,core_hp,core_max_hp,kills,
    started_at,ended_at,standard_run_match_id
  ) values (
    v_user_id,p_mode,v_result_reason,v_session.last_wave,v_elapsed_ms,v_score,
    v_session.last_gold,v_session.last_core_hp,v_session.last_core_max_hp,v_ledger_kills,
    v_session.started_at,p_ended_at,p_match_id
  ) returning id into v_completed_match_id;

  insert into public.mode_records(
    user_id,mode,best_wave,best_survival_ms,best_score,best_kills
  ) values (
    v_user_id,p_mode,v_session.last_wave,v_elapsed_ms,v_score,v_ledger_kills
  )
  on conflict (user_id,mode) do update set
    best_wave = greatest(public.mode_records.best_wave, excluded.best_wave),
    best_survival_ms = case
      when excluded.best_wave > public.mode_records.best_wave then excluded.best_survival_ms
      when excluded.best_wave = public.mode_records.best_wave then greatest(public.mode_records.best_survival_ms, excluded.best_survival_ms)
      else public.mode_records.best_survival_ms
    end,
    best_score = case
      when excluded.best_wave > public.mode_records.best_wave then excluded.best_score
      when excluded.best_wave = public.mode_records.best_wave
       and excluded.best_survival_ms > public.mode_records.best_survival_ms then excluded.best_score
      when excluded.best_wave = public.mode_records.best_wave
       and excluded.best_survival_ms = public.mode_records.best_survival_ms then greatest(public.mode_records.best_score, excluded.best_score)
      else public.mode_records.best_score
    end,
    best_kills = greatest(public.mode_records.best_kills, excluded.best_kills),
    updated_at = now();

  update public.profiles
  set best_wave=greatest(coalesce(best_wave,0),v_session.last_wave),
      shards=coalesce(shards,0)+v_shards,
      runs=coalesce(runs,0)+1,
      lifetime_kills=coalesce(lifetime_kills,0)+v_ledger_kills,
      updated_at=now()
  where user_id=v_user_id;

  if not found then raise exception 'profile_missing'; end if;

  update public.standard_run_sessions
  set status='completed',
      completed_at=p_ended_at,
      updated_at=now()
  where match_id=p_match_id;

  v_inserted := true;

  return query
  select v_completed_match_id,mr.best_wave,mr.best_survival_ms,mr.best_score,mr.best_kills,
         not v_inserted,case when v_inserted then v_shards else 0 end,
         v_session.last_wave,v_ledger_kills,v_elapsed_ms,v_score
  from public.mode_records mr
  where mr.user_id=v_user_id and mr.mode=p_mode;
end;
$$;

revoke all on function public.persist_verified_standard_result_v3(
  uuid,text,text,integer,integer,integer,timestamptz,timestamptz
) from public, anon;
grant execute on function public.persist_verified_standard_result_v3(
  uuid,text,text,integer,integer,integer,timestamptz,timestamptz
) to authenticated;
