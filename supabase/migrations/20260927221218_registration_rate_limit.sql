create schema if not exists private;

create table if not exists private.registration_rate_limits (
  rate_key text primary key,
  window_started_at timestamptz not null default now(),
  attempts integer not null default 0 check (attempts >= 0),
  updated_at timestamptz not null default now()
);

revoke all on table private.registration_rate_limits from public, anon, authenticated;

create or replace function public.consume_registration_rate_limit(
  p_key text,
  p_window_seconds integer,
  p_max_attempts integer
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_now timestamptz := now();
  v_attempts integer;
begin
  if p_key is null or length(p_key) < 8
     or p_window_seconds < 1
     or p_max_attempts < 1 then
    return false;
  end if;

  insert into private.registration_rate_limits(rate_key, window_started_at, attempts, updated_at)
  values (p_key, v_now, 1, v_now)
  on conflict (rate_key) do update
  set
    window_started_at = case
      when private.registration_rate_limits.window_started_at <= v_now - make_interval(secs => p_window_seconds)
        then v_now
      else private.registration_rate_limits.window_started_at
    end,
    attempts = case
      when private.registration_rate_limits.window_started_at <= v_now - make_interval(secs => p_window_seconds)
        then 1
      else private.registration_rate_limits.attempts + 1
    end,
    updated_at = v_now
  returning attempts into v_attempts;

  return v_attempts <= p_max_attempts;
end;
$$;

revoke all on function public.consume_registration_rate_limit(text, integer, integer)
  from public, anon, authenticated;
grant execute on function public.consume_registration_rate_limit(text, integer, integer)
  to service_role;
