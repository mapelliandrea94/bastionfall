create or replace function public.abandon_stale_standard_runs_for_user(
  p_now timestamptz default now(),
  p_timeout_seconds integer default 21600
)
returns integer
language plpgsql
set search_path=''
as $function$
declare
  v_user_id uuid := (select auth.uid());
  v_timeout integer := greatest(coalesce(p_timeout_seconds,21600),3600);
  v_count integer := 0;
begin
  if v_user_id is null then raise exception 'authentication_required'; end if;
  if not public.bastionfall_server_write_allowed() then raise exception 'server_authorization_required'; end if;
  if p_now is null then raise exception 'invalid_now'; end if;

  update public.standard_run_sessions s
  set status='abandoned',
      completed_at=coalesce(s.completed_at,p_now),
      updated_at=p_now
  where s.user_id=v_user_id
    and s.status='active'
    and s.last_reported_at < p_now - make_interval(secs => v_timeout)
    and not exists (
      select 1
      from public.online_run_snapshots o
      where o.match_id=s.match_id
        and o.user_id=s.user_id
        and o.status='active'
    );

  get diagnostics v_count = row_count;
  return v_count;
end;
$function$;

revoke all on function public.abandon_stale_standard_runs_for_user(timestamptz,integer) from public, anon;
grant execute on function public.abandon_stale_standard_runs_for_user(timestamptz,integer) to authenticated;
