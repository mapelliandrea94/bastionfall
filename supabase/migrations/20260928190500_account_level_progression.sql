alter table public.profiles
  add column if not exists account_xp bigint not null default 0 check (account_xp >= 0);

create or replace function public.grant_profile_xp(p_amount integer)
returns table(account_xp bigint, fortress_level integer)
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_total_xp bigint;
  v_remaining bigint;
  v_level integer := 1;
  v_required bigint;
begin
  if v_user_id is null then
    raise exception 'authentication_required';
  end if;

  if p_amount < 0 or p_amount > 100000 then
    raise exception 'invalid_xp_amount';
  end if;

  update public.profiles
  set account_xp = profiles.account_xp + p_amount,
      updated_at = now()
  where user_id = v_user_id
  returning profiles.account_xp into v_total_xp;

  if v_total_xp is null then
    raise exception 'profile_missing';
  end if;

  v_remaining := v_total_xp;
  while v_level < 10000 loop
    v_required := 400 + ((v_level - 1) * 120) + ((v_level - 1) * (v_level - 1) * 8);
    exit when v_remaining < v_required;
    v_remaining := v_remaining - v_required;
    v_level := v_level + 1;
  end loop;

  update public.profiles
  set fortress_level = v_level,
      updated_at = now()
  where user_id = v_user_id;

  account_xp := v_total_xp;
  fortress_level := v_level;
  return next;
end;
$$;

grant execute on function public.grant_profile_xp(integer) to authenticated;
