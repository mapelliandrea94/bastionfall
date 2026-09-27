drop policy if exists "mode_records_select_own" on public.mode_records;
drop policy if exists "mode_records_select_server" on public.mode_records;
create policy "mode_records_select_owner_or_server"
on public.mode_records
for select
to authenticated
using (
  (select auth.uid()) = user_id
  or (select public.bastionfall_server_write_allowed())
);

drop policy if exists "profiles_select_own" on public.profiles;
drop policy if exists "profiles_select_server" on public.profiles;
create policy "profiles_select_owner_or_server"
on public.profiles
for select
to authenticated
using (
  (select auth.uid()) = user_id
  or (select public.bastionfall_server_write_allowed())
);
