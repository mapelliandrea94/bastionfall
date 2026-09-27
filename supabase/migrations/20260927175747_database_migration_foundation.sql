create schema if not exists bastionfall_internal;

comment on schema bastionfall_internal is
  'Private database helpers for Bastionfall migrations. Not exposed through the Data API.';

revoke all on schema bastionfall_internal from public;
revoke all on schema bastionfall_internal from anon;
revoke all on schema bastionfall_internal from authenticated;

create or replace function bastionfall_internal.set_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

revoke all on function bastionfall_internal.set_updated_at() from public;
revoke all on function bastionfall_internal.set_updated_at() from anon;
revoke all on function bastionfall_internal.set_updated_at() from authenticated;
