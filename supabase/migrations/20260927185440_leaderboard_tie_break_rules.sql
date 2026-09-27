drop index if exists public.mode_records_leaderboard_idx;

create index mode_records_leaderboard_idx
on public.mode_records (
  mode,
  best_wave desc,
  best_survival_ms desc,
  best_score desc,
  best_kills desc,
  updated_at asc,
  user_id asc
);
