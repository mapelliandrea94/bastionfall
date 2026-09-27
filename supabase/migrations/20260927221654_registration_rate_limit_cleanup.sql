create index if not exists registration_rate_limits_updated_at_idx
  on private.registration_rate_limits (updated_at);

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

  delete from private.registration_rate_limits
  where updated_at < v_now - interval '24 hours';

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
