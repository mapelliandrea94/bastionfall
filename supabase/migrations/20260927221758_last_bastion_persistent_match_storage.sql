create table if not exists public.last_bastion_queue (
  user_id uuid primary key references auth.users(id) on delete cascade,
  ticket_id uuid not null unique default gen_random_uuid(),
  joined_at timestamptz not null default now(),
  ready boolean not null default false,
  updated_at timestamptz not null default now()
);

create table if not exists public.last_bastion_matches (
  id uuid primary key default gen_random_uuid(),
  seed text not null unique,
  status text not null default 'active'
    check (status in ('active','finished','cancelled')),
  created_at timestamptz not null default now(),
  started_at timestamptz not null,
  wave_starts_at timestamptz not null,
  ended_at timestamptz,
  winner_user_id uuid references auth.users(id) on delete set null,
  updated_at timestamptz not null default now()
);

create table if not exists public.last_bastion_participants (
  match_id uuid not null references public.last_bastion_matches(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  slot integer not null check (slot between 1 and 8),
  alive boolean not null default true,
  last_seen_at timestamptz not null default now(),
  wave integer not null default 0 check (wave >= 0 and wave <= 9999),
  core_hp integer not null default 20 check (core_hp >= 0 and core_hp <= 100000),
  placement integer check (placement is null or placement between 1 and 8),
  eliminated_at timestamptz,
  updated_at timestamptz not null default now(),
  primary key (match_id, user_id),
  unique (match_id, slot)
);

create unique index if not exists last_bastion_active_user_idx
  on public.last_bastion_participants(user_id)
  where alive = true;

create index if not exists last_bastion_queue_ready_joined_idx
  on public.last_bastion_queue(ready, joined_at);

create index if not exists last_bastion_matches_status_updated_idx
  on public.last_bastion_matches(status, updated_at);

create index if not exists last_bastion_participants_match_idx
  on public.last_bastion_participants(match_id, slot);

alter table public.last_bastion_queue enable row level security;
alter table public.last_bastion_matches enable row level security;
alter table public.last_bastion_participants enable row level security;

revoke all on public.last_bastion_queue from public, anon, authenticated;
revoke all on public.last_bastion_matches from public, anon, authenticated;
revoke all on public.last_bastion_participants from public, anon, authenticated;

grant select, insert, update, delete on public.last_bastion_queue to service_role;
grant select, insert, update, delete on public.last_bastion_matches to service_role;
grant select, insert, update, delete on public.last_bastion_participants to service_role;

create or replace function public.cleanup_stale_last_bastion_state(
  p_queue_ttl_seconds integer default 1800,
  p_match_ttl_seconds integer default 86400
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  delete from public.last_bastion_queue
  where updated_at < now() - make_interval(secs => greatest(p_queue_ttl_seconds, 60));

  update public.last_bastion_matches
  set status = 'cancelled',
      ended_at = coalesce(ended_at, now()),
      updated_at = now()
  where status = 'active'
    and updated_at < now() - make_interval(secs => greatest(p_match_ttl_seconds, 300));
end;
$$;

revoke all on function public.cleanup_stale_last_bastion_state(integer, integer)
  from public, anon, authenticated;
grant execute on function public.cleanup_stale_last_bastion_state(integer, integer)
  to service_role;
