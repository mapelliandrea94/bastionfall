create or replace function public.resolve_stale_last_bastion_participants_for_match(
  p_match_id uuid,
  p_now timestamptz default now(),
  p_timeout_seconds integer default 60
)
returns table (
  resolved_participants integer,
  finished_match boolean
)
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_match_status text;
  v_alive_count integer := 0;
  v_stale_count integer := 0;
  v_remaining_count integer := 0;
  v_winner uuid;
  v_timeout integer := greatest(coalesce(p_timeout_seconds, 60), 30);
begin
  if not public.bastionfall_server_write_allowed() then
    raise exception 'server_authorization_required';
  end if;
  if p_match_id is null or p_now is null then
    raise exception 'invalid_arguments';
  end if;

  select status into v_match_status
  from public.last_bastion_matches
  where id = p_match_id
  for update;

  if not found then raise exception 'match_not_found'; end if;
  if v_match_status <> 'active' then
    return query select 0, false;
    return;
  end if;

  select
    count(*) filter (where alive = true),
    count(*) filter (
      where alive = true
        and last_seen_at < p_now - make_interval(secs => v_timeout)
    )
  into v_alive_count, v_stale_count
  from public.last_bastion_participants
  where match_id = p_match_id;

  if v_stale_count = 0 then
    return query select 0, false;
    return;
  end if;

  with stale as (
    select
      user_id,
      row_number() over (order by last_seen_at asc, slot asc) as rn
    from public.last_bastion_participants
    where match_id = p_match_id
      and alive = true
      and last_seen_at < p_now - make_interval(secs => v_timeout)
  )
  update public.last_bastion_participants p
  set alive = false,
      core_hp = 0,
      placement = greatest(1, v_alive_count - stale.rn::integer + 1),
      eliminated_at = coalesce(p.eliminated_at, p_now),
      updated_at = p_now
  from stale
  where p.match_id = p_match_id
    and p.user_id = stale.user_id;

  v_remaining_count := v_alive_count - v_stale_count;

  if v_remaining_count = 1 then
    select user_id into v_winner
    from public.last_bastion_participants
    where match_id = p_match_id and alive = true
    limit 1;

    update public.last_bastion_participants
    set placement = 1, updated_at = p_now
    where match_id = p_match_id and user_id = v_winner;

    update public.last_bastion_matches
    set status = 'finished',
        winner_user_id = v_winner,
        ended_at = p_now,
        updated_at = p_now
    where id = p_match_id;

    return query select v_stale_count, true;
    return;
  elsif v_remaining_count = 0 then
    update public.last_bastion_matches
    set status = 'finished',
        winner_user_id = null,
        ended_at = p_now,
        updated_at = p_now
    where id = p_match_id;

    return query select v_stale_count, true;
    return;
  end if;

  update public.last_bastion_matches
  set updated_at = p_now
  where id = p_match_id;

  return query select v_stale_count, false;
end;
$$;

revoke all on function public.resolve_stale_last_bastion_participants_for_match(
  uuid, timestamptz, integer
) from public, anon;
grant execute on function public.resolve_stale_last_bastion_participants_for_match(
  uuid, timestamptz, integer
) to authenticated;
