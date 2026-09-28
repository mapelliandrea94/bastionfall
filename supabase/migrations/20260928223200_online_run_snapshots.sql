create table if not exists public.online_run_snapshots (
  match_id uuid primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  mode text not null check (mode in ('single-gate','tri-gate','tft-shop','sudden-siege','last-bastion')),
  snapshot jsonb not null,
  status text not null default 'active' check (status in ('active','completed','abandoned')),
  saved_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists online_run_snapshots_user_status_idx
  on public.online_run_snapshots(user_id,status,updated_at desc);

alter table public.online_run_snapshots enable row level security;

drop policy if exists "online_run_snapshots_server" on public.online_run_snapshots;
create policy "online_run_snapshots_server"
on public.online_run_snapshots
for all
to authenticated
using (public.bastionfall_server_write_allowed())
with check (public.bastionfall_server_write_allowed());

grant select, insert, update, delete on public.online_run_snapshots to authenticated;
