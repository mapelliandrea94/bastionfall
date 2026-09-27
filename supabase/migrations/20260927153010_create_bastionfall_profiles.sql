create table if not exists public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default 'Defender' check (char_length(display_name) between 1 and 40),
  fortress_level integer not null default 1 check (fortress_level between 1 and 10000),
  best_wave integer not null default 0 check (best_wave >= 0),
  shards integer not null default 0 check (shards >= 0),
  runs integer not null default 0 check (runs >= 0),
  lifetime_kills bigint not null default 0 check (lifetime_kills >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own"
on public.profiles for select
to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own"
on public.profiles for insert
to authenticated
with check ((select auth.uid()) = user_id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
on public.profiles for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

grant select, insert, update on table public.profiles to authenticated;
