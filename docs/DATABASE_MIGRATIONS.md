# Bastionfall Database Migrations

## Source of truth

GitHub `main` is the canonical source for database migration files.

All versioned SQL migrations live in:

`supabase/migrations/`

The production Supabase project must contain the same ordered migration history.

## Current baseline

- `20260927153010_create_bastionfall_profiles.sql`
- `20260927175747_database_migration_foundation.sql`
- `20260927180102_create_mode_specific_records.sql`
- `20260927180341_create_completed_match_results.sql`

The first migration captures the profile table that already existed in production before the migration folder was introduced.

The second migration establishes the private `bastionfall_internal` schema and the reusable `set_updated_at()` trigger helper.

## Rules for future migrations

1. One schema change per descriptively named migration.
2. Never edit a migration after it has been applied to production. Add a new migration instead.
3. Do not make untracked production schema changes through the Dashboard.
4. Any table created in an exposed schema such as `public` must have RLS enabled.
5. Data API access must be explicit: grant only the operations required by `anon` or `authenticated`.
6. Authorization policies must use row ownership checks such as `(select auth.uid()) = user_id`, not role-only access.
7. Internal helper functions belong in `bastionfall_internal`, not in the exposed `public` schema.
8. Run Supabase security and performance advisors after DDL changes.
9. Verify every applied migration with a read-only query before marking its batch complete.

## Batch ownership

- Batch 65 creates the migration foundation only.
- Batch 66 owns mode-specific record schema and creates `public.mode_records` with per-mode PB fields plus the leaderboard ordering index.
- Batch 67 owns completed match result schema and creates append-only `public.completed_matches` history. Authenticated clients may read only their own rows; trusted server code will own writes in later batches.

Do not move those table definitions into Batch 65.
