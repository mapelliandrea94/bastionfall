create or replace function public.bastionfall_server_write_allowed()
returns boolean
language sql
stable
security invoker
set search_path = ''
as $$
  select encode(
    extensions.digest(
      convert_to(
        coalesce(current_setting('request.headers', true)::jsonb ->> 'x-bastionfall-server-secret', ''),
        'UTF8'
      ),
      'sha256'
    ),
    'hex'
  ) = 'c1c0b8e631de8d87d310a1e2d7ef8f0348753db15009c018d843e026a2be58b0';
$$;

revoke all on function public.bastionfall_server_write_allowed() from public;
revoke all on function public.bastionfall_server_write_allowed() from anon;
grant execute on function public.bastionfall_server_write_allowed() to authenticated;

drop policy if exists "mode_records_insert_server" on public.mode_records;
create policy "mode_records_insert_server"
on public.mode_records
for insert
to authenticated
with check (
  (select auth.uid()) = user_id
  and (select public.bastionfall_server_write_allowed())
);

drop policy if exists "mode_records_update_server" on public.mode_records;
create policy "mode_records_update_server"
on public.mode_records
for update
to authenticated
using (
  (select auth.uid()) = user_id
  and (select public.bastionfall_server_write_allowed())
)
with check (
  (select auth.uid()) = user_id
  and (select public.bastionfall_server_write_allowed())
);

drop policy if exists "completed_matches_insert_server" on public.completed_matches;
create policy "completed_matches_insert_server"
on public.completed_matches
for insert
to authenticated
with check (
  (select auth.uid()) = user_id
  and (select public.bastionfall_server_write_allowed())
);
