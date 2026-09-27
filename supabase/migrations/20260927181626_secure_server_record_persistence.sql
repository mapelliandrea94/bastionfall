drop function if exists public.persist_verified_standard_result(
  text, text, text, integer, bigint, bigint, integer, integer, integer, bigint, timestamptz, timestamptz
);

grant select, insert, update on table public.mode_records to authenticated;
grant select, insert on table public.completed_matches to authenticated;

drop policy if exists "mode_records_insert_own" on public.mode_records;
drop policy if exists "mode_records_update_own" on public.mode_records;

create policy "mode_records_insert_server"
on public.mode_records
for insert
to authenticated
with check (
  (select auth.uid()) = user_id
  and encode(
    extensions.digest(
      convert_to(
        coalesce(current_setting('request.headers', true)::jsonb ->> 'x-bastionfall-server-secret', ''),
        'UTF8'
      ),
      'sha256'
    ),
    'hex'
  ) = 'c1c0b8e631de8d87d310a1e2d7ef8f0348753db15009c018d843e026a2be58b0'
);

create policy "mode_records_update_server"
on public.mode_records
for update
to authenticated
using (
  (select auth.uid()) = user_id
  and encode(
    extensions.digest(
      convert_to(
        coalesce(current_setting('request.headers', true)::jsonb ->> 'x-bastionfall-server-secret', ''),
        'UTF8'
      ),
      'sha256'
    ),
    'hex'
  ) = 'c1c0b8e631de8d87d310a1e2d7ef8f0348753db15009c018d843e026a2be58b0'
)
with check (
  (select auth.uid()) = user_id
  and encode(
    extensions.digest(
      convert_to(
        coalesce(current_setting('request.headers', true)::jsonb ->> 'x-bastionfall-server-secret', ''),
        'UTF8'
      ),
      'sha256'
    ),
    'hex'
  ) = 'c1c0b8e631de8d87d310a1e2d7ef8f0348753db15009c018d843e026a2be58b0'
);

drop policy if exists "completed_matches_insert_server" on public.completed_matches;
create policy "completed_matches_insert_server"
on public.completed_matches
for insert
to authenticated
with check (
  (select auth.uid()) = user_id
  and encode(
    extensions.digest(
      convert_to(
        coalesce(current_setting('request.headers', true)::jsonb ->> 'x-bastionfall-server-secret', ''),
        'UTF8'
      ),
      'sha256'
    ),
    'hex'
  ) = 'c1c0b8e631de8d87d310a1e2d7ef8f0348753db15009c018d843e026a2be58b0'
);
