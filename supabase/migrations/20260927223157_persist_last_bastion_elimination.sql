create or replace function public.persist_last_bastion_elimination(
  p_match_id uuid,
  p_user_id uuid,
  p_wave integer,
  p_eliminated_at timestamptz default now()
)
returns table (
  match_status text,
  placement integer,
  winner_user_id uuid
)
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_match_status text;
  v_alive boolean;
  v_alive_after uuid[];
  v_placement integer;
  v_winner uuid;
begin
  if not public.bastionfall_server_write_allowed() then
    raise exception 'server_authorization_required';
  end if;

  if (select auth.uid()) is distinct from p_user_id then
    raise exception 'elimination_user_mismatch';
  end if;

  if p_match_id is null or p_user_id is null or p_eliminated_at is null
     or p_wave < 0 or p_wave > 9999 then
    raise exception 'invalid_wave';
  end if;

  select m.status, p.alive
    into v_match_status, v_alive
  from public.last_bastion_participants p
  join public.last_bastion_matches m on m.id = p.match_id
  where p.match_id = p_match_id
    and p.user_id = p_user_id
  for update of p, m;

  if not found then
    raise exception 'match_not_found';
  end if;

  if v_match_status <> 'active' then
    select p.placement, m.winner_user_id, m.status
      into v_placement, v_winner, v_match_status
    from public.last_bastion_participants p
    join public.last_bastion_matches m on m.id=p.match_id
    where p.match_id=p_match_id and p.user_id=p_user_id;

    return query select v_match_status, v_placement, v_winner;
    return;
  end if;

  if v_alive is not true then
    select placement into v_placement
    from public.last_bastion_participants
    where match_id=p_match_id and user_id=p_user_id;

    select winner_user_id into v_winner
    from public.last_bastion_matches
    where id=p_match_id;

    return query select 'active'::text, v_placement, v_winner;
    return;
  end if;

  select array_agg(user_id order by slot)
    into v_alive_after
  from public.last_bastion_participants
  where match_id = p_match_id
    and alive = true
    and user_id <> p_user_id;

  v_placement := coalesce(array_length(v_alive_after, 1), 0) + 1;

  update public.last_bastion_participants
  set alive = false,
      wave = greatest(wave, p_wave),
      core_hp = 0,
      placement = v_placement,
      eliminated_at = p_eliminated_at,
      last_seen_at = p_eliminated_at,
      updated_at = p_eliminated_at
  where match_id = p_match_id
    and user_id = p_user_id;

  if coalesce(array_length(v_alive_after, 1), 0) = 1 then
    v_winner := v_alive_after[1];

    update public.last_bastion_participants
    set placement = 1,
        updated_at = p_eliminated_at
    where match_id = p_match_id
      and user_id = v_winner;

    update public.last_bastion_matches
    set status = 'finished',
        winner_user_id = v_winner,
        ended_at = p_eliminated_at,
        updated_at = p_eliminated_at
    where id = p_match_id;

    v_match_status := 'finished';
  elsif coalesce(array_length(v_alive_after, 1), 0) = 0 then
    update public.last_bastion_matches
    set status = 'finished',
        winner_user_id = null,
        ended_at = p_eliminated_at,
        updated_at = p_eliminated_at
    where id = p_match_id;

    v_match_status := 'finished';
  else
    update public.last_bastion_matches
    set updated_at = p_eliminated_at
    where id = p_match_id;

    v_match_status := 'active';
  end if;

  return query select v_match_status, v_placement, v_winner;
end;
$$;

revoke all on function public.persist_last_bastion_elimination(
  uuid, uuid, integer, timestamptz
) from public, anon;
grant execute on function public.persist_last_bastion_elimination(
  uuid, uuid, integer, timestamptz
) to authenticated;
