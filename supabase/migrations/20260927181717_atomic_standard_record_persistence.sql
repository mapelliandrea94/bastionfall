create or replace function public.persist_verified_standard_result(
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
returns table (
  completed_match_id uuid,
  best_wave integer,
  best_survival_ms bigint,
  best_score bigint,
  best_kills bigint
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

  if p_mode not in ('single-gate', 'tri-gate') then
    raise exception 'unsupported_mode';
  end if;

  insert into public.completed_matches (
    user_id, mode, result_reason, wave, elapsed_ms, score, gold,
    core_hp, core_max_hp, kills, started_at, ended_at
  )
  values (
    v_user_id, p_mode, p_result_reason, p_wave, p_elapsed_ms, p_score, p_gold,
    p_core_hp, p_core_max_hp, p_kills, p_started_at, p_ended_at
  )
  returning id into v_match_id;

  insert into public.mode_records (
    user_id, mode, best_wave, best_survival_ms, best_score, best_kills
  )
  values (
    v_user_id, p_mode, p_wave, p_elapsed_ms, p_score, p_kills
  )
  on conflict (user_id, mode) do update
  set
    best_wave = case
      when excluded.best_wave > public.mode_records.best_wave then excluded.best_wave
      else public.mode_records.best_wave
    end,
    best_survival_ms = case
      when excluded.best_wave > public.mode_records.best_wave then excluded.best_survival_ms
      when excluded.best_wave = public.mode_records.best_wave
       and excluded.best_survival_ms > public.mode_records.best_survival_ms then excluded.best_survival_ms
      else public.mode_records.best_survival_ms
    end,
    best_score = case
      when excluded.best_wave > public.mode_records.best_wave then excluded.best_score
      when excluded.best_wave = public.mode_records.best_wave
       and excluded.best_survival_ms > public.mode_records.best_survival_ms then excluded.best_score
      when excluded.best_wave = public.mode_records.best_wave
       and excluded.best_survival_ms = public.mode_records.best_survival_ms
       and excluded.best_score > public.mode_records.best_score then excluded.best_score
      else public.mode_records.best_score
    end,
    best_kills = greatest(public.mode_records.best_kills, excluded.best_kills);

  return query
  select
    v_match_id,
    mr.best_wave,
    mr.best_survival_ms,
    mr.best_score,
    mr.best_kills
  from public.mode_records mr
  where mr.user_id = v_user_id
    and mr.mode = p_mode;
end;
$$;

revoke all on function public.persist_verified_standard_result(
  text, text, integer, bigint, bigint, integer, integer, integer, bigint, timestamptz, timestamptz
) from public;
revoke all on function public.persist_verified_standard_result(
  text, text, integer, bigint, bigint, integer, integer, integer, bigint, timestamptz, timestamptz
) from anon;
grant execute on function public.persist_verified_standard_result(
  text, text, integer, bigint, bigint, integer, integer, integer, bigint, timestamptz, timestamptz
) to authenticated;
