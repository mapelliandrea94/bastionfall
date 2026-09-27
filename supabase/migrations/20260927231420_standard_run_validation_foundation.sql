create table if not exists public.standard_run_sessions (
  match_id uuid primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  mode text not null check (mode in ('single-gate','tri-gate')),
  started_at timestamptz not null,
  last_reported_at timestamptz not null default now(),
  last_wave integer not null default 0 check (last_wave between 0 and 9999),
  last_core_hp integer not null default 20 check (last_core_hp between 0 and 100000),
  last_core_max_hp integer not null default 20 check (last_core_max_hp between 1 and 100000),
  last_kills bigint not null default 0 check (last_kills >= 0),
  last_gold integer not null default 0 check (last_gold >= 0),
  status text not null default 'active' check (status in ('active','completed','abandoned')),
  completed_at timestamptz null,
  updated_at timestamptz not null default now()
);

create index if not exists standard_run_sessions_user_status_idx
  on public.standard_run_sessions(user_id, status, updated_at desc);

alter table public.standard_run_sessions enable row level security;

drop policy if exists "standard_run_sessions_server" on public.standard_run_sessions;
create policy "standard_run_sessions_server"
on public.standard_run_sessions
for all
to authenticated
using (public.bastionfall_server_write_allowed())
with check (public.bastionfall_server_write_allowed());

grant select, insert, update, delete on public.standard_run_sessions to authenticated;

create or replace function public.persist_standard_run_checkpoint(
  p_match_id uuid,
  p_mode text,
  p_started_at timestamptz,
  p_wave integer,
  p_core_hp integer,
  p_core_max_hp integer,
  p_kills bigint,
  p_gold integer,
  p_reported_at timestamptz default now()
)
returns table (
  wave integer,
  core_hp integer,
  core_max_hp integer,
  kills bigint,
  gold integer,
  last_reported_at timestamptz
)
language plpgsql
security invoker
set search_path=''
as $$
declare
  v_user_id uuid := (select auth.uid());
  v_current public.standard_run_sessions%rowtype;
begin
  if v_user_id is null then raise exception 'authentication_required'; end if;
  if not public.bastionfall_server_write_allowed() then raise exception 'server_authorization_required'; end if;
  if p_mode not in ('single-gate','tri-gate') then raise exception 'invalid_mode'; end if;
  if p_match_id is null or p_started_at is null or p_reported_at is null then raise exception 'invalid_checkpoint'; end if;
  if p_wave < 0 or p_wave > 9999 then raise exception 'invalid_wave'; end if;
  if p_core_max_hp < 1 or p_core_max_hp > 100000 or p_core_hp < 0 or p_core_hp > p_core_max_hp then raise exception 'invalid_core_hp'; end if;
  if p_kills < 0 or p_gold < 0 then raise exception 'invalid_checkpoint'; end if;

  select * into v_current
  from public.standard_run_sessions
  where match_id=p_match_id
  for update;

  if not found then
    insert into public.standard_run_sessions(
      match_id,user_id,mode,started_at,last_reported_at,last_wave,last_core_hp,last_core_max_hp,last_kills,last_gold,status,updated_at
    ) values (
      p_match_id,v_user_id,p_mode,p_started_at,p_reported_at,p_wave,p_core_hp,p_core_max_hp,p_kills,p_gold,'active',p_reported_at
    );
  else
    if v_current.user_id <> v_user_id then raise exception 'match_user_mismatch'; end if;
    if v_current.mode <> p_mode or v_current.started_at <> p_started_at then raise exception 'match_identity_mismatch'; end if;
    if v_current.status <> 'active' then raise exception 'run_not_active'; end if;
    if p_wave < v_current.last_wave then raise exception 'wave_regression'; end if;
    if p_kills < v_current.last_kills then raise exception 'kills_regression'; end if;
    if p_reported_at < v_current.last_reported_at then raise exception 'checkpoint_time_regression'; end if;

    update public.standard_run_sessions
    set last_reported_at=p_reported_at,
        last_wave=p_wave,
        last_core_hp=p_core_hp,
        last_core_max_hp=p_core_max_hp,
        last_kills=p_kills,
        last_gold=p_gold,
        updated_at=p_reported_at
    where match_id=p_match_id;
  end if;

  return query
  select s.last_wave,s.last_core_hp,s.last_core_max_hp,s.last_kills,s.last_gold,s.last_reported_at
  from public.standard_run_sessions s
  where s.match_id=p_match_id;
end;
$$;

revoke all on function public.persist_standard_run_checkpoint(
  uuid,text,timestamptz,integer,integer,integer,bigint,integer,timestamptz
) from public, anon;
grant execute on function public.persist_standard_run_checkpoint(
  uuid,text,timestamptz,integer,integer,integer,bigint,integer,timestamptz
) to authenticated;
