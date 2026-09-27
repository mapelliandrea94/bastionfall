drop index if exists public.last_bastion_active_user_idx;

create index if not exists last_bastion_participants_user_idx
  on public.last_bastion_participants(user_id);

grant select, insert, update, delete on public.last_bastion_matches to authenticated;
grant select, insert, update, delete on public.last_bastion_participants to authenticated;

drop policy if exists "last_bastion_matches_server" on public.last_bastion_matches;
create policy "last_bastion_matches_server"
on public.last_bastion_matches
for all
to authenticated
using ((select public.bastionfall_server_write_allowed()))
with check ((select public.bastionfall_server_write_allowed()));

drop policy if exists "last_bastion_participants_server" on public.last_bastion_participants;
create policy "last_bastion_participants_server"
on public.last_bastion_participants
for all
to authenticated
using ((select public.bastionfall_server_write_allowed()))
with check ((select public.bastionfall_server_write_allowed()));

create or replace function public.persist_last_bastion_match_foundation(
  p_match_id uuid,
  p_seed text,
  p_created_at timestamptz,
  p_started_at timestamptz,
  p_wave_starts_at timestamptz,
  p_participant_ids uuid[]
)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_user_id uuid;
  v_existing_match uuid;
begin
  if not public.bastionfall_server_write_allowed() then
    raise exception 'server_authorization_required';
  end if;

  if p_match_id is null
     or p_seed is null
     or length(p_seed) < 8
     or p_created_at is null
     or p_started_at is null
     or p_wave_starts_at is null
     or coalesce(array_length(p_participant_ids, 1), 0) < 2
     or array_length(p_participant_ids, 1) > 8 then
    raise exception 'invalid_match_payload';
  end if;

  if (
    select count(distinct participant_id)
    from unnest(p_participant_ids) participant_id
  ) <> array_length(p_participant_ids, 1) then
    raise exception 'duplicate_participant';
  end if;

  foreach v_user_id in array p_participant_ids loop
    select p.match_id
      into v_existing_match
    from public.last_bastion_participants p
    join public.last_bastion_matches m on m.id = p.match_id
    where p.user_id = v_user_id
      and m.status = 'active'
      and p.match_id <> p_match_id
    limit 1;

    if v_existing_match is not null then
      raise exception 'participant_already_in_active_match';
    end if;
  end loop;

  insert into public.last_bastion_matches (
    id, seed, status, created_at, started_at, wave_starts_at, updated_at
  )
  values (
    p_match_id, p_seed, 'active', p_created_at, p_started_at, p_wave_starts_at, now()
  )
  on conflict (id) do update
  set
    seed = excluded.seed,
    started_at = excluded.started_at,
    wave_starts_at = excluded.wave_starts_at,
    updated_at = now()
  where public.last_bastion_matches.status = 'active';

  insert into public.last_bastion_participants (
    match_id, user_id, slot, alive, last_seen_at, wave, core_hp, placement, updated_at
  )
  select
    p_match_id,
    participant_id,
    ordinality::integer,
    true,
    p_created_at,
    0,
    20,
    null,
    now()
  from unnest(p_participant_ids) with ordinality as u(participant_id, ordinality)
  on conflict (match_id, user_id) do update
  set
    slot = excluded.slot,
    updated_at = now();

  delete from public.last_bastion_queue
  where user_id = any(p_participant_ids);
end;
$$;

revoke all on function public.persist_last_bastion_match_foundation(
  uuid, text, timestamptz, timestamptz, timestamptz, uuid[]
) from public, anon;
grant execute on function public.persist_last_bastion_match_foundation(
  uuid, text, timestamptz, timestamptz, timestamptz, uuid[]
) to authenticated;
