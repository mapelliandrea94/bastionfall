drop policy if exists "mode_records_select_server" on public.mode_records;
create policy "mode_records_select_server"
on public.mode_records
for select
to authenticated
using (
  (select public.bastionfall_server_write_allowed())
);

drop policy if exists "profiles_select_server" on public.profiles;
create policy "profiles_select_server"
on public.profiles
for select
to authenticated
using (
  (select public.bastionfall_server_write_allowed())
);

create index if not exists mode_records_leaderboard_idx
on public.mode_records (
  mode,
  best_wave desc,
  best_survival_ms desc,
  best_score desc
);
