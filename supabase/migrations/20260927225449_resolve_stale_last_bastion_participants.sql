create or replace function public.resolve_stale_last_bastion_participants(
  p_now timestamptz default now(),
  p_timeout_seconds integer default 60
)
returns table (
  resolved_participants integer,
  finished_matches integer
)
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_match record;
  v_alive_count integer;
  v_stale_count integer;
  v_remaining_count integer;
  v_winner uuid;
  v_resolved integer := 0;
  v_finished integer := 0;
  v_timeout integer := greatest(coalesce(p_timeout_seconds, 60), 30);
begin
  if not public.bastionfall_server_write_allowed() then
    raise exception 'server_authorization_required';
  end if;

  if p_now is null then
    raise exception 'invalid_now';
  end if;

  for v_match in
    select id
    from public.last_bastion_matches
    where status = 'active'
    order by created_at
    for update
  loop
    select
      count(*) filter (where alive = true),
      count(*) filter (
        where alive = true
          and last_seen_at < p_now - make_interval(secs => v_timeout)
      )
    into v_alive_count, v_stale_count
    from public.last_bastion_participants
    where match_id = v_match.id;

    if v_stale_count = 0 then
      continue;
    end if;

    with stale as (
      select
        user_id,
        row_number() over (order by last_seen_at asc, slot asc) as rn
      from public.last_bastion_participants
      where match_id = v_match.id
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
    where p.match_id = v_match.id
      and p.user_id = stale.user_id;

    v_resolved := v_resolved + v_stale_count;
    v_remaining_count := v_alive_count - v_stale_count;

    if v_remaining_count = 1 then
      select user_id
      into v_winner
      from public.last_bastion_participants
      where match_id = v_match.id
        and alive = true
      limit 1;

      update public.last_bastion_participants
      set placement = 1,
          updated_at = p_now
      where match_id = v_match.id
        and user_id = v_winner;

      update public.last_bastion_matches
      set status = 'finished',
          winner_user_id = v_winner,
          ended_at = p_now,
          updated_at = p_now
      where id = v_match.id;

      v_finished := v_finished + 1;
    elsif v_remaining_count = 0 then
      update public.last_bastion_matches
      set status = 'finished',
          winner_user_id = null,
          ended_at = p_now,
          updated_at = p_now
      where id = v_match.id;

      v_finished := v_finished + 1;
    else
      update public.last_bastion_matches
      set updated_at = p_now
      where id = v_match.id;
    end if;
  end loop;

  return query select v_resolved, v_finished;
end;
$$;

revoke all on function public.resolve_stale_last_bastion_participants(
  timestamptz, integer
) from public, anon;
grant execute on function public.resolve_stale_last_bastion_participants(
  timestamptz, integer
) to authenticated;
