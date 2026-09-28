alter table public.mode_records
  drop constraint if exists mode_records_mode_check;
alter table public.mode_records
  add constraint mode_records_mode_check
  check (mode in ('single-gate','tri-gate','last-bastion','tft-shop','sudden-siege'));

alter table public.completed_matches
  drop constraint if exists completed_matches_mode_check;
alter table public.completed_matches
  add constraint completed_matches_mode_check
  check (mode in ('single-gate','tri-gate','last-bastion','tft-shop','sudden-siege'));

alter table public.completed_matches
  add column if not exists shop_run_match_id uuid;

create unique index if not exists completed_matches_shop_run_match_id_uidx
  on public.completed_matches(shop_run_match_id)
  where shop_run_match_id is not null;

create or replace function public.persist_verified_shop_result_v1(
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
  v_completed_match_id uuid;
  v_inserted boolean := false;
  v_shards integer := greatest(1, floor(greatest(p_wave,0)::numeric / 2)::integer);
begin
  if v_user_id is null then raise exception 'authentication_required'; end if;
  if not public.bastionfall_server_write_allowed() then raise exception 'server_authorization_required'; end if;
  if p_mode not in ('tft-shop','sudden-siege') then raise exception 'invalid_mode'; end if;
  if p_match_id is null or p_started_at is null or p_ended_at is null then raise exception 'invalid_match'; end if;
  if p_result_reason not in ('bastion-destroyed','player-exit') then raise exception 'invalid_result_reason'; end if;
  if p_wave < 0 or p_wave > 9999 then raise exception 'invalid_wave'; end if;
  if p_elapsed_ms < 0 then raise exception 'invalid_elapsed_ms'; end if;
  if p_score < 0 or p_gold < 0 or p_kills < 0 then raise exception 'invalid_result'; end if;
  if p_core_max_hp < 1 or p_core_hp < 0 or p_core_hp > p_core_max_hp then raise exception 'invalid_core_state'; end if;
  if p_ended_at < p_started_at then raise exception 'invalid_end_time'; end if;

  select cm.id into v_completed_match_id
  from public.completed_matches cm
  where cm.shop_run_match_id = p_match_id
  limit 1;

  if v_completed_match_id is null then
    insert into public.completed_matches(
      user_id,mode,result_reason,wave,elapsed_ms,score,gold,core_hp,core_max_hp,kills,
      started_at,ended_at,shop_run_match_id
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
    set best_wave = greatest(coalesce(best_wave,0), p_wave),
        shards = coalesce(shards,0) + v_shards,
        runs = coalesce(runs,0) + 1,
        lifetime_kills = coalesce(lifetime_kills,0) + p_kills,
        updated_at = now()
    where user_id = v_user_id;

    if not found then raise exception 'profile_missing'; end if;
    v_inserted := true;
  end if;

  return query
  select v_completed_match_id,mr.best_wave,mr.best_survival_ms,mr.best_score,mr.best_kills,
         not v_inserted,case when v_inserted then v_shards else 0 end
  from public.mode_records mr
  where mr.user_id=v_user_id and mr.mode=p_mode;
end;
$$;

revoke all on function public.persist_verified_shop_result_v1(
  uuid,text,text,integer,bigint,bigint,integer,integer,integer,bigint,timestamptz,timestamptz
) from public, anon;
grant execute on function public.persist_verified_shop_result_v1(
  uuid,text,text,integer,bigint,bigint,integer,integer,integer,bigint,timestamptz,timestamptz
) to authenticated;
