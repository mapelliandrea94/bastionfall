create or replace function public.persist_last_bastion_heartbeat(
  p_match_id uuid,
  p_user_id uuid,
  p_wave integer,
  p_core_hp integer,
  p_seen_at timestamptz default now()
)
returns table (
  wave integer,
  core_hp integer,
  last_seen_at timestamptz
)
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_match_status text;
  v_alive boolean;
  v_current_wave integer;
  v_last_seen_at timestamptz;
begin
  if not public.bastionfall_server_write_allowed() then
    raise exception 'server_authorization_required';
  end if;

  if (select auth.uid()) is distinct from p_user_id then
    raise exception 'heartbeat_user_mismatch';
  end if;

  if p_match_id is null
     or p_user_id is null
     or p_seen_at is null
     or p_wave < 0
     or p_wave > 9999 then
    raise exception 'invalid_wave';
  end if;

  if p_core_hp < 0 or p_core_hp > 100000 then
    raise exception 'invalid_core_hp';
  end if;

  select m.status, p.alive, p.wave, p.last_seen_at
    into v_match_status, v_alive, v_current_wave, v_last_seen_at
  from public.last_bastion_participants p
  join public.last_bastion_matches m on m.id = p.match_id
  where p.match_id = p_match_id
    and p.user_id = p_user_id
  for update of p, m;

  if not found then
    raise exception 'match_not_found';
  end if;

  if v_match_status <> 'active' then
    raise exception 'match_finished';
  end if;

  if v_alive is not true then
    raise exception 'participant_eliminated';
  end if;

  if p_wave < v_current_wave then
    raise exception 'wave_regression';
  end if;

  if v_last_seen_at is not null
     and p_seen_at < v_last_seen_at + interval '750 milliseconds' then
    raise exception 'heartbeat_rate_limited';
  end if;

  update public.last_bastion_participants
  set wave = p_wave,
      core_hp = p_core_hp,
      last_seen_at = p_seen_at,
      updated_at = p_seen_at
  where match_id = p_match_id
    and user_id = p_user_id;

  update public.last_bastion_matches
  set updated_at = p_seen_at
  where id = p_match_id
    and status = 'active';

  return query
  select p.wave, p.core_hp, p.last_seen_at
  from public.last_bastion_participants p
  where p.match_id = p_match_id
    and p.user_id = p_user_id;
end;
$$;

revoke all on function public.persist_last_bastion_heartbeat(
  uuid, uuid, integer, integer, timestamptz
) from public, anon;
grant execute on function public.persist_last_bastion_heartbeat(
  uuid, uuid, integer, integer, timestamptz
) to authenticated;
