alter table public.completed_matches
  add column if not exists standard_run_match_id uuid null
  references public.standard_run_sessions(match_id) on delete set null;

create unique index if not exists completed_matches_standard_run_match_uidx
  on public.completed_matches(standard_run_match_id)
  where standard_run_match_id is not null;

create or replace function public.persist_verified_standard_result_v2(
  p_match_id uuid,
  p_mode text,
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
returns table(
  completed_match_id uuid,
  best_wave integer,
  best_survival_ms bigint,
  best_score bigint,
  best_kills bigint,
  already_recorded boolean,
  earned_shards integer
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
  v_shards integer := greatest(1, floor(p_wave::numeric / 2)::integer);
begin
  if v_user_id is null then raise exception 'authentication_required'; end if;
  if not public.bastionfall_server_write_allowed() then raise exception 'server_authorization_required'; end if;

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
    select v_completed_match_id,mr.best_wave,mr.best_survival_ms,mr.best_score,mr.best_kills,true,0
    from public.mode_records mr
    where mr.user_id=v_user_id and mr.mode=p_mode;
    return;
  end if;

  if v_session.status <> 'active' then raise exception 'run_not_active'; end if;
  if p_wave <> v_session.last_wave then raise exception 'final_wave_checkpoint_mismatch'; end if;
  if p_kills <> v_session.last_kills then raise exception 'final_kills_checkpoint_mismatch'; end if;
  if p_gold <> v_session.last_gold then raise exception 'final_gold_checkpoint_mismatch'; end if;
  if p_core_hp <> v_session.last_core_hp or p_core_max_hp <> v_session.last_core_max_hp then
    raise exception 'final_core_checkpoint_mismatch';
  end if;

  insert into public.completed_matches(
    user_id,mode,result_reason,wave,elapsed_ms,score,gold,core_hp,core_max_hp,kills,
    started_at,ended_at,standard_run_match_id
  ) values (
    v_user_id,p_mode,p_result_reason,p_wave,p_elapsed_ms,p_score,p_gold,p_core_hp,p_core_max_hp,p_kills,
    p_started_at,p_ended_at,p_match_id
  ) returning id into v_completed_match_id;

  insert into public.mode_records(
    user_id,mode,best_wave,best_survival_ms,best_score,best_kills
  ) values (
    v_user_id,p_mode,p_wave,p_elapsed_ms,p_score,p_kills
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
  set best_wave=greatest(coalesce(best_wave,0),p_wave),
      shards=coalesce(shards,0)+v_shards,
      runs=coalesce(runs,0)+1,
      lifetime_kills=coalesce(lifetime_kills,0)+p_kills,
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
         not v_inserted,case when v_inserted then v_shards else 0 end
  from public.mode_records mr
  where mr.user_id=v_user_id and mr.mode=p_mode;
end;
$$;

revoke all on function public.persist_verified_standard_result_v2(
  uuid,text,text,integer,bigint,bigint,integer,integer,integer,bigint,timestamptz,timestamptz
) from public, anon;
grant execute on function public.persist_verified_standard_result_v2(
  uuid,text,text,integer,bigint,bigint,integer,integer,integer,bigint,timestamptz,timestamptz
) to authenticated;
