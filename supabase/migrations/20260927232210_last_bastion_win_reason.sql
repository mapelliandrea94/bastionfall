alter table public.completed_matches
  drop constraint if exists completed_matches_result_reason_check;

alter table public.completed_matches
  add constraint completed_matches_result_reason_check
  check (result_reason in ('bastion-destroyed', 'player-exit', 'last-bastion-win'));

