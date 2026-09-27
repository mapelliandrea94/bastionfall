alter function public.persist_verified_last_bastion_result_v2(
  text, integer, bigint, bigint, integer, integer, integer, bigint,
  timestamptz, timestamptz, integer, boolean
) security invoker;

revoke all on function public.persist_verified_last_bastion_result_v2(
  text, integer, bigint, bigint, integer, integer, integer, bigint,
  timestamptz, timestamptz, integer, boolean
) from public;

revoke all on function public.persist_verified_last_bastion_result_v2(
  text, integer, bigint, bigint, integer, integer, integer, bigint,
  timestamptz, timestamptz, integer, boolean
) from anon;

grant execute on function public.persist_verified_last_bastion_result_v2(
  text, integer, bigint, bigint, integer, integer, integer, bigint,
  timestamptz, timestamptz, integer, boolean
) to authenticated;
