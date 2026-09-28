create table if not exists public.standard_run_wave_kills (
  match_id uuid not null references public.standard_run_sessions(match_id) on delete cascade,
  wave_number integer not null check (wave_number between 1 and 10000),
  claimed_kills integer not null default 0 check (claimed_kills >= 0),
  max_kills integer not null check (max_kills >= 0),
  finalized boolean not null default false,
  updated_at timestamptz not null default now(),
  primary key (match_id, wave_number)
);

alter table public.standard_run_wave_kills enable row level security;

drop policy if exists "standard_run_wave_kills_server" on public.standard_run_wave_kills;
create policy "standard_run_wave_kills_server"
on public.standard_run_wave_kills
for all
to authenticated
using (public.bastionfall_server_write_allowed())
with check (public.bastionfall_server_write_allowed());

grant select, insert, update, delete on public.standard_run_wave_kills to authenticated;

create or replace function public.persist_standard_run_progress_v2(
  p_match_id uuid,
  p_mode text,
  p_started_at timestamptz,
  p_wave integer,
  p_core_hp integer,
  p_core_max_hp integer,
  p_kills bigint,
  p_gold integer,
  p_reported_at timestamptz,
  p_claim_wave integer,
  p_kill_delta integer,
  p_max_wave_kills integer,
  p_finalize_claim_wave boolean
)
returns table (
  wave integer,
  core_hp integer,
  core_max_hp integer,
  kills bigint,
  gold integer,
  last_reported_at timestamptz,
  claim_wave integer,
  claimed_kills integer,
  max_kills integer,
  finalized boolean
)
language plpgsql
security invoker
set search_path=''
as $$
declare
  v_user_id uuid := (select auth.uid());
  v_current public.standard_run_sessions%rowtype;
  v_ledger public.standard_run_wave_kills%rowtype;
  v_next_claimed integer;
begin
  if v_user_id is null then raise exception 'authentication_required'; end if;
  if not public.bastionfall_server_write_allowed() then raise exception 'server_authorization_required'; end if;
  if p_mode not in ('single-gate','tri-gate') then raise exception 'invalid_mode'; end if;
  if p_match_id is null or p_started_at is null or p_reported_at is null then raise exception 'invalid_checkpoint'; end if;
  if p_wave < 0 or p_wave > 9999 then raise exception 'invalid_wave'; end if;
  if p_claim_wave < 1 or p_claim_wave > 10000 then raise exception 'invalid_claim_wave'; end if;
  if p_kill_delta < 0 or p_max_wave_kills < 0 then raise exception 'invalid_kill_claim'; end if;
  if p_core_max_hp < 1 or p_core_max_hp > 100000 or p_core_hp < 0 or p_core_hp > p_core_max_hp then raise exception 'invalid_core_hp'; end if;
  if p_kills < 0 or p_gold < 0 then raise exception 'invalid_checkpoint'; end if;

  select * into v_current
  from public.standard_run_sessions
  where match_id=p_match_id
  for update;

  if not found then raise exception 'run_checkpoint_missing'; end if;
  if v_current.user_id <> v_user_id then raise exception 'match_user_mismatch'; end if;
  if v_current.mode <> p_mode or v_current.started_at <> p_started_at then raise exception 'match_identity_mismatch'; end if;
  if v_current.status <> 'active' then raise exception 'run_not_active'; end if;
  if p_wave < v_current.last_wave then raise exception 'wave_regression'; end if;
  if p_wave > v_current.last_wave + 1 then raise exception 'wave_jump_too_large'; end if;
  if p_kills < v_current.last_kills then raise exception 'kills_regression'; end if;
  if p_kills - v_current.last_kills <> p_kill_delta then raise exception 'kill_delta_mismatch'; end if;
  if p_reported_at < v_current.last_reported_at then raise exception 'checkpoint_time_regression'; end if;

  select * into v_ledger
  from public.standard_run_wave_kills
  where match_id=p_match_id and wave_number=p_claim_wave
  for update;

  if not found then
    if p_kill_delta > p_max_wave_kills then raise exception 'wave_kill_budget_exceeded'; end if;
    insert into public.standard_run_wave_kills(
      match_id,wave_number,claimed_kills,max_kills,finalized,updated_at
    ) values (
      p_match_id,p_claim_wave,p_kill_delta,p_max_wave_kills,coalesce(p_finalize_claim_wave,false),p_reported_at
    );
  else
    if v_ledger.finalized and p_kill_delta > 0 then raise exception 'wave_kill_ledger_finalized'; end if;
    if v_ledger.max_kills <> p_max_wave_kills then raise exception 'wave_kill_capacity_mismatch'; end if;
    v_next_claimed := v_ledger.claimed_kills + p_kill_delta;
    if v_next_claimed > v_ledger.max_kills then raise exception 'wave_kill_budget_exceeded'; end if;

    update public.standard_run_wave_kills
    set claimed_kills=v_next_claimed,
        finalized=v_ledger.finalized or coalesce(p_finalize_claim_wave,false),
        updated_at=p_reported_at
    where match_id=p_match_id and wave_number=p_claim_wave;
  end if;

  update public.standard_run_sessions
  set last_reported_at=p_reported_at,
      last_wave=p_wave,
      last_core_hp=p_core_hp,
      last_core_max_hp=p_core_max_hp,
      last_kills=p_kills,
      last_gold=p_gold,
      updated_at=p_reported_at
  where match_id=p_match_id;

  return query
  select
    s.last_wave,s.last_core_hp,s.last_core_max_hp,s.last_kills,s.last_gold,s.last_reported_at,
    l.wave_number,l.claimed_kills,l.max_kills,l.finalized
  from public.standard_run_sessions s
  join public.standard_run_wave_kills l
    on l.match_id=s.match_id and l.wave_number=p_claim_wave
  where s.match_id=p_match_id;
end;
$$;

revoke all on function public.persist_standard_run_progress_v2(
  uuid,text,timestamptz,integer,integer,integer,bigint,integer,timestamptz,integer,integer,integer,boolean
) from public, anon;
grant execute on function public.persist_standard_run_progress_v2(
  uuid,text,timestamptz,integer,integer,integer,bigint,integer,timestamptz,integer,integer,integer,boolean
) to authenticated;
