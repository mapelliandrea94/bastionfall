create index if not exists completed_matches_last_bastion_match_idx
  on public.completed_matches (last_bastion_match_id)
  where last_bastion_match_id is not null;

create index if not exists last_bastion_matches_winner_user_idx
  on public.last_bastion_matches (winner_user_id)
  where winner_user_id is not null;

drop index if exists public.last_bastion_participants_match_idx;
