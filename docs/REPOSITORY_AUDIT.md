# Bastionfall Repository Audit

Audit date: 2026-09-27
Source of truth: `mapelliandrea94/bastionfall` / `main`

## Current architecture

- Frontend: React 19 + Vite 7, single-entry client in `src/main.jsx`.
- Styling: current menu/run shell in `src/menu.css`; legacy playable prototype styles remain in `src/style.css`.
- Backend: Express 5 in `server.mjs`, serving `dist` and exposing JSON APIs.
- Auth: Supabase JS client with email/password UI. Registration delegates to the Supabase Edge Function `register-player`; login uses `signInWithPassword`.
- Database: Supabase `profiles` table is referenced by the server. Repository contains no tracked SQL migration/schema files at this audit point.
- Current API: `/api/health`, `/api/config`, `/api/profile`, `/api/run/complete`, `/api/fortress/upgrade`.
- Deployment: production-ready Node start command exists (`npm start`), but no Railway config, Procfile, GitHub Actions workflow, or tracked staging configuration exists in the repository.
- Branches found: `main` only.

## Current product state

### Reusable
- Menu-first navigation shell.
- Email/password authentication modal.
- Supabase session integration.
- Express authentication middleware using bearer tokens + Supabase RLS.
- Dark-fantasy menu visual language.
- Responsive CSS foundation.
- Historical playable tower-defense prototype in Git history, including pathing, towers, enemy movement, waves, bosses, upgrades, economy hooks and run submission logic.
- Existing concepts for Ranger/Archer, Cannon, Frost, Gold Mine, War Forge and Guardian Shrine can be reused rather than reinvented.

### Present but incomplete
- Current battlefield is visual/static only.
- Current build buttons are disabled.
- Current wave button is disabled.
- Leaderboard/profile/settings screens are placeholders.
- No current Single Gate / Tri-Gate / Last Bastion mode architecture.
- No multiplayer lobby/synchronization/spectate system.
- No persisted mode-specific records.
- No server-authoritative match lifecycle.
- No tracked database migrations.
- No CI/deployment workflow in repository.

### Conflicts / technical debt
- `POST /api/fortress/upgrade` persists permanent fortress progression; the legacy prototype used it for permanent max-HP gain. This conflicts with the new rule that accounts must not gain permanent combat power.
- `POST /api/run/complete` trusts client-provided wave/kills too much for competitive records.
- Current `profiles.best_wave` is mode-agnostic and insufficient for Single Gate / Tri-Gate separation.
- Current menu mode cards still describe Solo/Duo/Trio/Squad rather than Single Gate / Tri-Gate / Last Bastion.
- `src/style.css` is legacy/orphan styling and should be mined carefully, not blindly deleted.
- Gameplay is currently concentrated in one large `src/main.jsx`; future extraction should be incremental rather than a rewrite.

## Stabilization strategy

1. Keep `main` playable/online-ready after every batch.
2. Prefer extraction and adapters over large rewrites.
3. Restore useful legacy gameplay behavior in controlled slices.
4. Establish explicit mode IDs and run state before persistence.
5. Move competitive results toward server-owned match lifecycle before leaderboards matter.
6. Preserve account progression only for cosmetics/prestige/statistics.
7. Add schema migrations to version database changes.
8. Add CI/deployment verification before production cutover.

## Audit conclusion

The current project is a small but usable foundation, not a blank repository. The safest route is to evolve the menu-first shell and selectively recover proven gameplay logic from Git history, while replacing conflicting permanent-power and trust-the-client assumptions.


## Runtime baseline verification — BATCH 2/120

Verified on Railway production after the roadmap commit:

- Project: `Bastionfall`
- Service: `bastionfall-web`
- Environment: `production`
- Source: `mapelliandrea94/bastionfall`, branch `main`
- Builder: Railway Railpack
- Runtime: Node.js 24.21.0 selected by Railpack
- Build command detected and executed: `npm run build`
- Vite production build: PASS (71 modules transformed, build completed)
- Start command: `npm run start` -> `node server.mjs`
- Server bind: port 3000
- Latest deployment for roadmap commit `af7a8476fee86566f8df32d9d77b989d45cda20e`: SUCCESS
- Production domain: `bastionfall-web-production.up.railway.app`
- Required Supabase server/client variable names are present in Railway configuration.
- No production crash was observed in deploy logs.

Non-blocking warning:
- No `package-lock.json` / explicit package-manager version is currently tracked, so installs are not fully deterministic. Address this during deployment hardening rather than inside an unrelated gameplay batch.
