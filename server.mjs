import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHmac, randomUUID, timingSafeEqual } from 'node:crypto';
import { createClient } from '@supabase/supabase-js';
import { advanceLastBastionMatchmaking, eliminateLastBastionParticipant, getLastBastionActiveMatchPersistenceSnapshot, getLastBastionActiveMatchUserIds, getLastBastionMatchmakingFixtures, getLastBastionMatchStatus, getLastBastionQueueStatus, hydrateLastBastionActiveMatches, hydrateLastBastionQueue, joinLastBastionQueue, leaveLastBastionQueue, recordLastBastionHeartbeat, setLastBastionReady } from './server/lastBastionMatchmaking.js';
import { calculateRunScore } from './src/game/run/runScore.js';
import { generateWavePlan } from './src/game/spawning/waveDirector.js';
import { getBandWaveScaling } from './src/game/balance/difficultyBands.js';
import { getTriGateWaveScaling } from './src/game/balance/triGatePacing.js';

const app = express();
const port = Number(process.env.PORT || 3000);
const here = path.dirname(fileURLToPath(import.meta.url));
const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_PUBLISHABLE_KEY || '';
const matchTokenSecret = process.env.MATCH_TOKEN_SECRET || '';

app.disable('x-powered-by');
app.use(express.json({ limit: '32kb', strict: true }));
app.use((_req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'same-origin');
  res.setHeader('Cross-Origin-Resource-Policy', 'same-origin');
  next();
});

const abuseBuckets = new Map();
const consumedMatchCompletions = new Map();
const ABUSE_BUCKET_TTL_MS = 10 * 60 * 1000;
const COMPLETION_REPLAY_TTL_MS = 25 * 60 * 60 * 1000;
const LAST_BASTION_ABANDON_TIMEOUT_SECONDS = 60;

function getStandardRunValidationBounds(mode, matchId, completedWave) {
  const seed = `${mode}:${matchId}`;
  const safeWave = Math.max(0, Math.floor(Number(completedWave) || 0));
  let maxKills = 0;
  let minElapsedMs = 0;

  for (let waveNumber = 1; waveNumber <= safeWave + 1; waveNumber += 1) {
    const plan = generateWavePlan({ seed, waveNumber, mode });
    maxKills += Math.max(0, Number(plan.enemyCount) || 0);

    if (waveNumber <= safeWave) {
      const scaling = mode === 'tri-gate'
        ? getTriGateWaveScaling(waveNumber)
        : getBandWaveScaling(waveNumber);
      const enemyCount = Math.max(1, Number(plan.enemyCount) || 1);
      minElapsedMs += Math.max(0, (enemyCount - 1) * Math.max(0, Number(scaling.spawnIntervalMs) || 0));
    }
  }

  return Object.freeze({
    maxKills,
    minElapsedMs: Math.floor(minElapsedMs)
  });
}

function validateLastBastionWavePace(identity, wave, nowMs = Date.now()) {
  const startedAtMs = Date.parse(identity?.startedAt || '');
  if (!Number.isFinite(startedAtMs) || nowMs < startedAtMs) {
    return Object.freeze({ ok: false, error: 'wave_before_match_start' });
  }

  const bounds = getStandardRunValidationBounds('last-bastion', identity.matchId, wave);
  const elapsedMs = nowMs - startedAtMs;
  if (elapsedMs + 1500 < bounds.minElapsedMs) {
    return Object.freeze({
      ok: false,
      error: 'wave_progression_too_fast',
      minElapsedMs: bounds.minElapsedMs,
      elapsedMs
    });
  }

  return Object.freeze({ ok: true, elapsedMs, minElapsedMs: bounds.minElapsedMs });
}


function pruneTimedMap(map, nowMs, ttlMs) {
  for (const [key, value] of map) {
    const touchedAtMs = Number(value?.touchedAtMs ?? value ?? 0);
    if (!Number.isFinite(touchedAtMs) || nowMs - touchedAtMs > ttlMs) map.delete(key);
  }
}

function rateLimitUser(action, { windowMs, max }) {
  return (req, res, next) => {
    const userId = String(req.user?.id || '');
    if (!userId) return res.status(401).json({ error: 'invalid_user' });

    const nowMs = Date.now();
    pruneTimedMap(abuseBuckets, nowMs, ABUSE_BUCKET_TTL_MS);
    const key = action + ':' + userId;
    const current = abuseBuckets.get(key);
    const fresh = !current || nowMs - current.windowStartedAtMs >= windowMs;
    const bucket = fresh
      ? { windowStartedAtMs: nowMs, count: 0, touchedAtMs: nowMs }
      : current;

    bucket.count += 1;
    bucket.touchedAtMs = nowMs;
    abuseBuckets.set(key, bucket);

    if (bucket.count > max) {
      res.setHeader('Retry-After', String(Math.max(1, Math.ceil((windowMs - (nowMs - bucket.windowStartedAtMs)) / 1000))));
      return res.status(429).json({ error: 'rate_limited' });
    }
    next();
  };
}

function encodeBase64Url(value) {
  return Buffer.from(value).toString('base64url');
}

function decodeBase64Url(value) {
  return Buffer.from(value, 'base64url').toString('utf8');
}

function signMatchIdentity(payload) {
  if (!matchTokenSecret) return null;
  const body = encodeBase64Url(JSON.stringify(payload));
  const signature = createHmac('sha256', matchTokenSecret).update(body).digest('base64url');
  return `${body}.${signature}`;
}

function verifyMatchIdentity(token) {
  if (!matchTokenSecret || !token || !String(token).includes('.')) return null;
  const [body, signature] = String(token).split('.');
  if (!body || !signature) return null;

  const expected = createHmac('sha256', matchTokenSecret).update(body).digest();
  let actual;
  try {
    actual = Buffer.from(signature, 'base64url');
  } catch {
    return null;
  }

  if (expected.length !== actual.length || !timingSafeEqual(expected, actual)) return null;

  try {
    return JSON.parse(decodeBase64Url(body));
  } catch {
    return null;
  }
}

function clientForToken(token, extraHeaders = {}) {
  return createClient(supabaseUrl, supabaseKey, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: {
      headers: {
        Authorization: 'Bearer ' + token,
        ...extraHeaders
      }
    }
  });
}

async function requireUser(req, res, next) {
  if (!supabaseUrl || !supabaseKey) return res.status(503).json({ error: 'server_not_configured' });
  const token = String(req.headers.authorization || '').replace(/^Bearer\s+/i, '');
  if (!token) return res.status(401).json({ error: 'missing_token' });
  const userClient = clientForToken(token);
  const { data, error } = await userClient.auth.getUser(token);
  if (error || !data.user) return res.status(401).json({ error: 'invalid_token' });
  req.user = data.user;
  req.db = userClient;
  req.accessToken = token;
  next();
}

app.get('/api/health', (_req, res) => res.json({
  ok: true,
  game: 'Bastionfall',
  version: '0.1.1',
  revision: process.env.RAILWAY_GIT_COMMIT_SHA || null,
  deploymentId: process.env.RAILWAY_DEPLOYMENT_ID || null,
  matchIdentityConfigured: Boolean(matchTokenSecret)
}));
app.get('/api/config', (_req, res) => res.json({ startingGold: 240, baseHp: 20, waveBonus: 35 }));

const STARTABLE_MODES = new Set(['single-gate', 'tri-gate', 'last-bastion']);
const LAST_BASTION_MATCHMAKING_FIXTURE = Object.freeze(getLastBastionMatchmakingFixtures());

function attachLastBastionMatchToken(result, userId) {
  if (!result?.match) return result;
  const identityPayload = {
    v: 1,
    matchId: result.match.id,
    userId,
    mode: 'last-bastion',
    startedAt: result.match.startedAt
  };
  return {
    ...result,
    match: {
      ...result.match,
      token: signMatchIdentity(identityPayload)
    }
  };
}

async function hydratePersistentLastBastionState(req) {
  const serverDb = clientForToken(req.accessToken, {
    'x-bastionfall-server-secret': matchTokenSecret
  });

  const abandonSweep = await serverDb.rpc('resolve_stale_last_bastion_participants', {
    p_now: new Date().toISOString(),
    p_timeout_seconds: LAST_BASTION_ABANDON_TIMEOUT_SECONDS
  });
  if (abandonSweep.error) {
    console.error('Last Bastion abandon sweep failed:', abandonSweep.error.message);
    return { ok: false, error: 'last_bastion_abandon_resolution_failed', serverDb };
  }

  const finishedRetentionCutoff = new Date(Date.now() - COMPLETION_REPLAY_TTL_MS).toISOString();
  const [activeMatchesRead, recentFinishedMatchesRead, queueRead] = await Promise.all([
    serverDb
      .from('last_bastion_matches')
      .select('id,seed,status,created_at,started_at,wave_starts_at,ended_at,winner_user_id')
      .eq('status', 'active')
      .order('created_at', { ascending: true }),
    serverDb
      .from('last_bastion_matches')
      .select('id,seed,status,created_at,started_at,wave_starts_at,ended_at,winner_user_id')
      .eq('status', 'finished')
      .gte('ended_at', finishedRetentionCutoff)
      .order('ended_at', { ascending: true }),
    serverDb
      .from('last_bastion_queue')
      .select('user_id,ticket_id,joined_at,ready,updated_at')
      .order('joined_at', { ascending: true })
  ]);

  if (activeMatchesRead.error || recentFinishedMatchesRead.error || queueRead.error) {
    console.error(
      'Last Bastion state hydrate failed:',
      activeMatchesRead.error?.message || recentFinishedMatchesRead.error?.message || queueRead.error?.message
    );
    return { ok: false, error: 'last_bastion_persistence_read_failed', serverDb };
  }

  const recoveredMatches = [
    ...(activeMatchesRead.data || []),
    ...(recentFinishedMatchesRead.data || [])
  ];
  const recoveredMatchIds = recoveredMatches.map((match) => match.id);

  let participantsRead = { data: [], error: null };
  if (recoveredMatchIds.length > 0) {
    participantsRead = await serverDb
      .from('last_bastion_participants')
      .select('match_id,user_id,slot,alive,last_seen_at,wave,core_hp,placement,eliminated_at')
      .in('match_id', recoveredMatchIds)
      .order('slot', { ascending: true });
  }

  if (participantsRead.error) {
    console.error('Last Bastion participant hydrate failed:', participantsRead.error.message);
    return { ok: false, error: 'last_bastion_persistence_read_failed', serverDb };
  }

  hydrateLastBastionActiveMatches(recoveredMatches, participantsRead.data || []);
  hydrateLastBastionQueue(queueRead.data || []);

  return { ok: true, serverDb };
}

async function persistLastBastionQueueTicket(serverDb, ticket) {
  if (!ticket) return { ok: true };
  const { error } = await serverDb
    .from('last_bastion_queue')
    .upsert({
      user_id: ticket.userId,
      ticket_id: ticket.ticketId,
      joined_at: ticket.joinedAt,
      ready: Boolean(ticket.ready),
      updated_at: ticket.ready && ticket.readyAt ? ticket.readyAt : new Date().toISOString()
    }, { onConflict: 'user_id' });

  return error ? { ok: false, error } : { ok: true };
}

async function persistCreatedLastBastionMatch(serverDb, participantIds = []) {
  const ids = Array.isArray(participantIds) ? participantIds.filter(Boolean) : [];
  if (ids.length < 2) return { ok: false, error: new Error('match_persistence_snapshot_missing') };

  const snapshot = getLastBastionActiveMatchPersistenceSnapshot(ids[0]);
  if (!snapshot || snapshot.participantIds.length < 2) {
    return { ok: false, error: new Error('match_persistence_snapshot_missing') };
  }

  const { error } = await serverDb.rpc('persist_last_bastion_match_foundation', {
    p_match_id: snapshot.id,
    p_seed: snapshot.seed,
    p_created_at: snapshot.createdAt,
    p_started_at: snapshot.startedAt,
    p_wave_starts_at: snapshot.waveStartsAt,
    p_participant_ids: snapshot.participantIds
  });

  return error ? { ok: false, error } : { ok: true };
}

app.post('/api/match/start', requireUser, rateLimitUser('match-start', { windowMs: 10000, max: 6 }), async (req, res) => {
  if (!matchTokenSecret) {
    return res.status(503).json({ error: 'match_identity_not_configured' });
  }

  const mode = String(req.body?.mode || '').trim();
  if (!STARTABLE_MODES.has(mode)) {
    return res.status(400).json({ error: 'invalid_mode' });
  }

  const matchId = randomUUID();
  const startedAt = new Date().toISOString();
  const seed = `${mode}:${matchId}`;
  const identityPayload = {
    v: 1,
    matchId,
    userId: req.user.id,
    mode,
    startedAt
  };
  const matchToken = signMatchIdentity(identityPayload);

  if (mode === 'single-gate' || mode === 'tri-gate') {
    const serverDb = clientForToken(req.accessToken, {
      'x-bastionfall-server-secret': matchTokenSecret
    });
    const { error } = await serverDb.rpc('persist_standard_run_checkpoint', {
      p_match_id: matchId,
      p_mode: mode,
      p_started_at: startedAt,
      p_wave: 0,
      p_core_hp: 20,
      p_core_max_hp: 20,
      p_kills: 0,
      p_gold: mode === 'tri-gate' ? 320 : 240,
      p_reported_at: startedAt
    });
    if (error) {
      console.error('Standard run foundation persistence failed:', error.message);
      return res.status(500).json({ error: 'run_foundation_persist_failed' });
    }
  }

  return res.status(201).json({
    match: {
      id: matchId,
      userId: req.user.id,
      mode,
      startedAt,
      seed,
      token: matchToken
    }
  });
});

app.post('/api/run/progress', requireUser, rateLimitUser('run-progress', { windowMs: 10000, max: 30 }), async (req, res) => {
  const matchToken = String(req.body?.matchToken || '');
  const identity = verifyMatchIdentity(matchToken);
  if (!identity) return res.status(400).json({ error: 'invalid_match_token' });
  if (identity.userId !== req.user.id) return res.status(403).json({ error: 'match_user_mismatch' });

  const mode = String(req.body?.mode || '').trim();
  if (!['single-gate', 'tri-gate'].includes(mode) || identity.mode !== mode) {
    return res.status(400).json({ error: 'match_mode_mismatch' });
  }

  const wave = Number(req.body?.wave);
  const coreHp = Number(req.body?.coreHp);
  const coreMaxHp = Number(req.body?.coreMaxHp);
  const kills = Number(req.body?.kills);
  const gold = Number(req.body?.gold);
  if (!Number.isInteger(wave) || wave < 0 || wave > 9999) return res.status(400).json({ error: 'invalid_wave' });
  if (!Number.isInteger(coreMaxHp) || coreMaxHp < 1 || coreMaxHp > 100000) return res.status(400).json({ error: 'invalid_core_max_hp' });
  if (!Number.isInteger(coreHp) || coreHp < 0 || coreHp > coreMaxHp) return res.status(400).json({ error: 'invalid_core_hp' });
  if (!Number.isInteger(kills) || kills < 0 || kills > 1000000) return res.status(400).json({ error: 'invalid_kills' });
  if (!Number.isInteger(gold) || gold < 0 || gold > 10000000) return res.status(400).json({ error: 'invalid_gold' });

  const startedAtMs = Date.parse(identity.startedAt);
  if (!Number.isFinite(startedAtMs)) {
    return res.status(400).json({ error: 'invalid_match_started_at' });
  }

  const checkpointNowMs = Date.now();
  const waveBounds = getStandardRunValidationBounds(mode, identity.matchId, wave);
  if (checkpointNowMs - startedAtMs + 1500 < waveBounds.minElapsedMs) {
    return res.status(400).json({ error: 'wave_progression_too_fast' });
  }

  const serverDb = clientForToken(req.accessToken, {
    'x-bastionfall-server-secret': matchTokenSecret
  });

  const { data: currentRun, error: currentRunError } = await serverDb
    .from('standard_run_sessions')
    .select('last_wave,status')
    .eq('match_id', identity.matchId)
    .eq('user_id', req.user.id)
    .maybeSingle();

  if (currentRunError || !currentRun) {
    return res.status(409).json({ error: 'run_checkpoint_missing' });
  }
  if (currentRun.status !== 'active') {
    return res.status(409).json({ error: 'run_not_active' });
  }
  if (wave < Number(currentRun.last_wave)) {
    return res.status(400).json({ error: 'wave_regression' });
  }
  if (wave > Number(currentRun.last_wave) + 1) {
    return res.status(400).json({ error: 'wave_jump_too_large' });
  }

  const { data, error } = await serverDb.rpc('persist_standard_run_checkpoint', {
    p_match_id: identity.matchId,
    p_mode: mode,
    p_started_at: identity.startedAt,
    p_wave: wave,
    p_core_hp: coreHp,
    p_core_max_hp: coreMaxHp,
    p_kills: kills,
    p_gold: gold,
    p_reported_at: new Date(checkpointNowMs).toISOString()
  });

  if (error) {
    const message = String(error.message || '');
    if (message.includes('wave_regression')) return res.status(400).json({ error: 'wave_regression' });
    if (message.includes('wave_jump_too_large')) return res.status(400).json({ error: 'wave_jump_too_large' });
    if (message.includes('initial_wave_must_be_zero')) return res.status(400).json({ error: 'initial_wave_must_be_zero' });
    if (message.includes('kills_regression')) return res.status(400).json({ error: 'kills_regression' });
    if (message.includes('run_not_active')) return res.status(409).json({ error: 'run_not_active' });
    console.error('Standard run checkpoint failed:', error.message);
    return res.status(500).json({ error: 'run_progress_persist_failed' });
  }

  return res.json({ ok: true, checkpoint: Array.isArray(data) ? data[0] ?? null : data });
});

app.post('/api/last-bastion/matchmaking/join', requireUser, rateLimitUser('lb-join', { windowMs: 10000, max: 8 }), async (req, res) => {
  const hydrated = await hydratePersistentLastBastionState(req);
  if (!hydrated.ok) return res.status(503).json({ error: hydrated.error });

  const result = joinLastBastionQueue(req.user.id);
  if (!result.ok) return res.status(400).json({ error: result.error || 'matchmaking_join_failed' });

  const persisted = await persistLastBastionQueueTicket(hydrated.serverDb, result.ticket);
  if (!persisted.ok) {
    console.error('Last Bastion queue join persistence failed:', persisted.error.message);
    return res.status(500).json({ error: 'queue_persistence_write_failed' });
  }

  return res.status(result.created ? 201 : 200).json(result);
});

app.post('/api/last-bastion/matchmaking/leave', requireUser, rateLimitUser('lb-leave', { windowMs: 10000, max: 8 }), async (req, res) => {
  const hydrated = await hydratePersistentLastBastionState(req);
  if (!hydrated.ok) return res.status(503).json({ error: hydrated.error });

  const result = leaveLastBastionQueue(req.user.id);
  if (!result.ok) return res.status(409).json({ error: result.error });

  const { error } = await hydrated.serverDb
    .from('last_bastion_queue')
    .delete()
    .eq('user_id', req.user.id);

  if (error) {
    console.error('Last Bastion queue leave persistence failed:', error.message);
    return res.status(500).json({ error: 'queue_persistence_write_failed' });
  }

  return res.json(result);
});

app.post('/api/last-bastion/matchmaking/ready', requireUser, rateLimitUser('lb-ready', { windowMs: 10000, max: 10 }), async (req, res) => {
  const hydrated = await hydratePersistentLastBastionState(req);
  if (!hydrated.ok) return res.status(503).json({ error: hydrated.error });

  const result = setLastBastionReady(req.user.id, req.body?.ready !== false);
  if (!result.ok) return res.status(400).json({ error: result.error || 'matchmaking_ready_failed' });

  if (result.matched && result.match) {
    const participantIds = getLastBastionActiveMatchUserIds(req.user.id);
    const persistedMatch = await persistCreatedLastBastionMatch(hydrated.serverDb, participantIds);
    if (!persistedMatch.ok) {
      console.error('Last Bastion match persistence failed:', persistedMatch.error.message);
      return res.status(500).json({ error: 'match_persistence_write_failed' });
    }
  } else {
    const persisted = await persistLastBastionQueueTicket(hydrated.serverDb, result.ticket);
    if (!persisted.ok) {
      console.error('Last Bastion ready persistence failed:', persisted.error.message);
      return res.status(500).json({ error: 'queue_persistence_write_failed' });
    }
  }

  return res.json(attachLastBastionMatchToken(result, req.user.id));
});

app.get('/api/last-bastion/matchmaking/status', requireUser, async (req, res) => {
  const hydrated = await hydratePersistentLastBastionState(req);
  if (!hydrated.ok) return res.status(503).json({ error: hydrated.error });

  const advanced = advanceLastBastionMatchmaking(Date.now());
  if (advanced.matched) {
    const persistedMatch = await persistCreatedLastBastionMatch(hydrated.serverDb, advanced.participantIds);
    if (!persistedMatch.ok) {
      console.error('Last Bastion fill-window match persistence failed:', persistedMatch.error.message);
      return res.status(500).json({ error: 'match_persistence_write_failed' });
    }
  }

  return res.json(attachLastBastionMatchToken(getLastBastionQueueStatus(req.user.id), req.user.id));
});

app.post('/api/last-bastion/match/heartbeat', requireUser, async (req, res) => {
  const matchToken = String(req.body?.matchToken || '');
  const identity = verifyMatchIdentity(matchToken);
  if (!identity) return res.status(400).json({ error: 'invalid_match_token' });
  if (identity.userId !== req.user.id) return res.status(403).json({ error: 'match_user_mismatch' });
  if (identity.mode !== 'last-bastion') return res.status(400).json({ error: 'match_mode_mismatch' });

  const wave = Number(req.body?.wave);
  const coreHp = Number(req.body?.coreHp);
  if (!Number.isInteger(wave) || wave < 0 || wave > 9999) {
    return res.status(400).json({ error: 'invalid_wave' });
  }
  if (!Number.isInteger(coreHp) || coreHp < 0 || coreHp > 28) {
    return res.status(400).json({ error: 'invalid_core_hp' });
  }

  const heartbeatPace = validateLastBastionWavePace(identity, wave);
  if (!heartbeatPace.ok) {
    return res.status(400).json({ error: heartbeatPace.error });
  }

  const hydrated = await hydratePersistentLastBastionState(req);
  if (!hydrated.ok) return res.status(503).json({ error: hydrated.error });

  const now = new Date().toISOString();
  const { error } = await hydrated.serverDb.rpc(
    'persist_last_bastion_heartbeat',
    {
      p_match_id: identity.matchId,
      p_user_id: req.user.id,
      p_wave: wave,
      p_core_hp: coreHp,
      p_seen_at: now
    }
  );

  if (error) {
    const message = String(error.message || '');
    if (message.includes('heartbeat_rate_limited')) {
      return res.status(429).json({ error: 'heartbeat_rate_limited' });
    }
    if (message.includes('wave_regression')) {
      return res.status(400).json({ error: 'wave_regression' });
    }
    if (message.includes('wave_progression_too_fast') || message.includes('wave_jump_too_large')) {
      return res.status(400).json({ error: 'wave_progression_too_fast' });
    }
    if (message.includes('heartbeat_before_match_start') || message.includes('heartbeat_from_future')) {
      return res.status(400).json({ error: 'invalid_heartbeat_time' });
    }
    if (message.includes('invalid_wave')) {
      return res.status(400).json({ error: 'invalid_wave' });
    }
    if (message.includes('invalid_core_hp')) {
      return res.status(400).json({ error: 'invalid_core_hp' });
    }
    if (message.includes('participant_eliminated')) {
      return res.status(409).json({ error: 'participant_eliminated' });
    }
    if (message.includes('match_finished')) {
      return res.status(409).json({ error: 'match_finished' });
    }
    if (message.includes('match_not_found')) {
      return res.status(404).json({ error: 'match_not_found' });
    }
    console.error('Last Bastion heartbeat persistence failed:', error.message);
    return res.status(500).json({ error: 'heartbeat_persistence_failed' });
  }

  const refreshed = await hydratePersistentLastBastionState(req);
  if (!refreshed.ok) return res.status(503).json({ error: refreshed.error });

  const result = getLastBastionMatchStatus(req.user.id, identity.matchId);
  if (!result.ok) return res.status(404).json({ error: result.error || 'heartbeat_failed' });

  return res.json(attachLastBastionMatchToken(result, req.user.id));
});

app.get('/api/last-bastion/match/status', requireUser, async (req, res) => {
  const matchToken = String(req.query?.matchToken || '');
  const identity = verifyMatchIdentity(matchToken);
  if (!identity) return res.status(400).json({ error: 'invalid_match_token' });
  if (identity.userId !== req.user.id) return res.status(403).json({ error: 'match_user_mismatch' });
  if (identity.mode !== 'last-bastion') return res.status(400).json({ error: 'match_mode_mismatch' });

  const hydrated = await hydratePersistentLastBastionState(req);
  if (!hydrated.ok) return res.status(503).json({ error: hydrated.error });

  const result = getLastBastionMatchStatus(req.user.id, identity.matchId);
  if (!result.ok) return res.status(404).json({ error: result.error || 'match_status_failed' });
  return res.json(attachLastBastionMatchToken(result, req.user.id));
});

app.post('/api/last-bastion/match/eliminate', requireUser, rateLimitUser('lb-eliminate', { windowMs: 10000, max: 6 }), async (req, res) => {
  const matchToken = String(req.body?.matchToken || '');
  const identity = verifyMatchIdentity(matchToken);
  if (!identity) return res.status(400).json({ error: 'invalid_match_token' });
  if (identity.userId !== req.user.id) return res.status(403).json({ error: 'match_user_mismatch' });
  if (identity.mode !== 'last-bastion') return res.status(400).json({ error: 'match_mode_mismatch' });

  const wave = Number(req.body?.wave);
  if (!Number.isInteger(wave) || wave < 0 || wave > 9999) {
    return res.status(400).json({ error: 'invalid_wave' });
  }

  const eliminationPace = validateLastBastionWavePace(identity, wave);
  if (!eliminationPace.ok) {
    return res.status(400).json({ error: eliminationPace.error });
  }

  const hydrated = await hydratePersistentLastBastionState(req);
  if (!hydrated.ok) return res.status(503).json({ error: hydrated.error });

  const eliminatedAt = new Date().toISOString();
  const { error } = await hydrated.serverDb.rpc(
    'persist_last_bastion_elimination',
    {
      p_match_id: identity.matchId,
      p_user_id: req.user.id,
      p_wave: wave,
      p_eliminated_at: eliminatedAt
    }
  );

  if (error) {
    const message = String(error.message || '');
    if (message.includes('invalid_wave')) return res.status(400).json({ error: 'invalid_wave' });
    if (message.includes('match_not_found')) return res.status(404).json({ error: 'match_not_found' });
    if (message.includes('elimination_user_mismatch')) return res.status(403).json({ error: 'match_user_mismatch' });
    console.error('Last Bastion elimination persistence failed:', error.message);
    return res.status(500).json({ error: 'elimination_persistence_failed' });
  }

  const refreshed = await hydratePersistentLastBastionState(req);
  if (!refreshed.ok) return res.status(503).json({ error: refreshed.error });

  const result = getLastBastionMatchStatus(req.user.id, identity.matchId);
  if (!result.ok) return res.status(404).json({ error: result.error || 'elimination_failed' });
  return res.json(attachLastBastionMatchToken(result, req.user.id));
});

app.get('/api/last-bastion/matchmaking/health', (_req, res) => {
  res.json({
    ok: Object.values(LAST_BASTION_MATCHMAKING_FIXTURE).every(Boolean),
    fixture: LAST_BASTION_MATCHMAKING_FIXTURE
  });
});

app.get('/api/profile', requireUser, async (req, res) => {
  const profileRead = await req.db
    .from('profiles')
    .select('*')
    .eq('user_id', req.user.id)
    .maybeSingle();

  if (profileRead.error) return res.status(500).json({ error: 'profile_read_failed' });

  let profile = profileRead.data;
  if (!profile) {
    const fresh = {
      user_id: req.user.id,
      display_name: req.user.user_metadata?.full_name || 'Defender'
    };
    const created = await req.db.from('profiles').insert(fresh).select('*').single();
    if (created.error) return res.status(500).json({ error: 'profile_create_failed' });
    profile = created.data;
  }

  const [modeRecordsResult, lastBastionResult] = await Promise.all([
    req.db
      .from('mode_records')
      .select('mode,best_wave,best_survival_ms,best_score,best_kills,updated_at')
      .order('mode', { ascending: true }),
    req.db
      .from('last_bastion_stats')
      .select('runs,wins,top3,best_placement,best_wave,best_survival_ms,best_score,lifetime_kills,total_survival_ms,updated_at')
      .maybeSingle()
  ]);

  if (modeRecordsResult.error) {
    return res.status(500).json({ error: 'mode_records_read_failed' });
  }
  if (lastBastionResult.error) {
    return res.status(500).json({ error: 'last_bastion_stats_read_failed' });
  }

  const byMode = {
    'single-gate': null,
    'tri-gate': null,
    'last-bastion': null
  };

  for (const record of modeRecordsResult.data || []) {
    if (Object.prototype.hasOwnProperty.call(byMode, record.mode)) {
      byMode[record.mode] = record;
    }
  }

  return res.json({
    profile,
    modes: byMode,
    lastBastion: lastBastionResult.data || null
  });
});

app.get('/api/leaderboards/:mode', requireUser, async (req, res) => {
  const mode = String(req.params?.mode || '').trim();
  if (!['single-gate', 'tri-gate'].includes(mode)) {
    return res.status(400).json({ error: 'unsupported_leaderboard_mode' });
  }

  const requestedLimit = Number(req.query?.limit ?? 50);
  const limit = Number.isInteger(requestedLimit)
    ? Math.max(1, Math.min(100, requestedLimit))
    : 50;

  const serverDb = clientForToken(req.accessToken, {
    'x-bastionfall-server-secret': matchTokenSecret
  });

  const recordsResult = await serverDb
    .from('mode_records')
    .select('user_id,mode,best_wave,best_survival_ms,best_score,best_kills,updated_at')
    .eq('mode', mode)
    .order('best_wave', { ascending: false })
    .order('best_survival_ms', { ascending: false })
    .order('best_score', { ascending: false })
    .order('best_kills', { ascending: false })
    .order('updated_at', { ascending: true })
    .order('user_id', { ascending: true })
    .limit(limit);

  if (recordsResult.error) {
    console.error('Leaderboard record read failed:', recordsResult.error.message);
    return res.status(500).json({ error: 'leaderboard_read_failed' });
  }

  const records = recordsResult.data || [];
  if (records.length === 0) {
    return res.json({ mode, entries: [], limit });
  }

  const userIds = [...new Set(records.map((record) => record.user_id))];
  const profilesResult = await serverDb
    .from('profiles')
    .select('user_id,display_name')
    .in('user_id', userIds);

  if (profilesResult.error) {
    console.error('Leaderboard profile read failed:', profilesResult.error.message);
    return res.status(500).json({ error: 'leaderboard_profile_read_failed' });
  }

  const namesByUser = new Map(
    (profilesResult.data || []).map((profile) => [profile.user_id, profile.display_name || 'Defender'])
  );

  const entries = records.map((record) => ({
    displayName: namesByUser.get(record.user_id) || 'Defender',
    bestWave: record.best_wave,
    bestSurvivalMs: record.best_survival_ms,
    bestScore: record.best_score,
    bestKills: record.best_kills,
    updatedAt: record.updated_at
  }));

  return res.json({
    mode,
    entries,
    limit
  });
});

app.post('/api/run/complete', requireUser, rateLimitUser('run-complete', { windowMs: 30000, max: 5 }), async (req, res) => {
  const matchToken = String(req.body?.matchToken || '');
  const identity = verifyMatchIdentity(matchToken);
  if (!identity) return res.status(400).json({ error: 'invalid_match_token' });
  if (identity.userId !== req.user.id) return res.status(403).json({ error: 'match_user_mismatch' });

  const completionKey = identity.matchId + ':' + req.user.id;
  const completionNowMs = Date.now();
  pruneTimedMap(consumedMatchCompletions, completionNowMs, COMPLETION_REPLAY_TTL_MS);
  if (
    consumedMatchCompletions.has(completionKey) &&
    !['last-bastion', 'single-gate', 'tri-gate'].includes(identity.mode)
  ) {
    return res.status(409).json({ error: 'completion_replay' });
  }

  const mode = String(req.body?.mode || '').trim();
  if (!STARTABLE_MODES.has(mode) || identity.mode !== mode) {
    return res.status(400).json({ error: 'match_mode_mismatch' });
  }

  const wave = Number(req.body?.wave);
  const kills = Number(req.body?.kills);
  const elapsedMs = Number(req.body?.elapsedMs);
  const score = Number(req.body?.score);
  const gold = Number(req.body?.gold);
  const coreHp = Number(req.body?.coreHp);
  const coreMaxHp = Number(req.body?.coreMaxHp);
  const resultReason = String(req.body?.resultReason || '');

  if (!Number.isInteger(wave) || wave < 0 || wave > 9999) {
    return res.status(400).json({ error: 'invalid_wave' });
  }
  if (!Number.isInteger(kills) || kills < 0 || kills > 1000000) {
    return res.status(400).json({ error: 'invalid_kills' });
  }
  if (!Number.isFinite(elapsedMs) || elapsedMs < 0 || elapsedMs > 1000 * 60 * 60 * 24) {
    return res.status(400).json({ error: 'invalid_elapsed_ms' });
  }
  if (!Number.isFinite(score) || score < 0 || score > 1000000000) {
    return res.status(400).json({ error: 'invalid_score' });
  }
  if (!Number.isInteger(gold) || gold < 0 || gold > 10000000) {
    return res.status(400).json({ error: 'invalid_gold' });
  }
  if (!Number.isInteger(coreMaxHp) || coreMaxHp < 1 || coreMaxHp > 100000) {
    return res.status(400).json({ error: 'invalid_core_max_hp' });
  }
  if (!Number.isInteger(coreHp) || coreHp < 0 || coreHp > coreMaxHp) {
    return res.status(400).json({ error: 'invalid_core_hp' });
  }
  if (!['bastion-destroyed', 'player-exit', 'last-bastion-win'].includes(resultReason)) {
    return res.status(400).json({ error: 'invalid_result_reason' });
  }

  const startedAtMs = Date.parse(identity.startedAt);
  if (!Number.isFinite(startedAtMs)) return res.status(400).json({ error: 'invalid_match_started_at' });

  const serverElapsedMs = Date.now() - startedAtMs;
  const clockSkewToleranceMs = 15000;
  if (serverElapsedMs < 0 || elapsedMs > serverElapsedMs + clockSkewToleranceMs) {
    return res.status(400).json({ error: 'elapsed_time_exceeds_server_clock' });
  }

  let persistedRecord = null;
  let savedProfile = null;
  let earnedShards = 0;
  let canonicalRun = null;

  if (mode === 'single-gate' || mode === 'tri-gate') {
    const serverDb = clientForToken(req.accessToken, {
      'x-bastionfall-server-secret': matchTokenSecret
    });

    const { data: checkpoint, error: checkpointError } = await serverDb
      .from('standard_run_sessions')
      .select('last_wave,last_core_hp,last_core_max_hp,last_kills,last_gold,last_reported_at,status')
      .eq('match_id', identity.matchId)
      .eq('user_id', req.user.id)
      .maybeSingle();

    if (checkpointError || !checkpoint) {
      return res.status(409).json({ error: 'run_checkpoint_missing' });
    }
    if (checkpoint.status !== 'active') {
      return res.status(409).json({ error: 'run_not_active' });
    }
    if (wave !== Number(checkpoint.last_wave)) {
      return res.status(400).json({ error: 'final_wave_checkpoint_mismatch' });
    }
    if (kills !== Number(checkpoint.last_kills)) {
      return res.status(400).json({ error: 'final_kills_checkpoint_mismatch' });
    }
    if (gold !== Number(checkpoint.last_gold)) {
      return res.status(400).json({ error: 'final_gold_checkpoint_mismatch' });
    }
    if (
      coreHp !== Number(checkpoint.last_core_hp) ||
      coreMaxHp !== Number(checkpoint.last_core_max_hp)
    ) {
      return res.status(400).json({ error: 'final_core_checkpoint_mismatch' });
    }
    if (!['bastion-destroyed', 'player-exit'].includes(resultReason)) {
      return res.status(400).json({ error: 'invalid_standard_result_reason' });
    }

    const checkpointReportedAtMs = Date.parse(checkpoint.last_reported_at || '');
    if (!Number.isFinite(checkpointReportedAtMs) || checkpointReportedAtMs < startedAtMs) {
      return res.status(409).json({ error: 'invalid_server_checkpoint_time' });
    }

    const officialElapsedMs = Math.max(0, checkpointReportedAtMs - startedAtMs);
    const validationBounds = getStandardRunValidationBounds(mode, identity.matchId, wave);
    if (kills > validationBounds.maxKills) {
      return res.status(400).json({ error: 'kills_exceed_wave_capacity' });
    }

    const minElapsedToleranceMs = 1500;
    if (officialElapsedMs + minElapsedToleranceMs < validationBounds.minElapsedMs) {
      return res.status(400).json({ error: 'elapsed_time_below_wave_minimum' });
    }

    const expectedScore = calculateRunScore({
      wave,
      elapsedMs: officialElapsedMs,
      kills,
      coreHp,
      coreMaxHp
    }).totalScore;

    canonicalRun = Object.freeze({
      elapsedMs: Math.floor(officialElapsedMs),
      score: expectedScore
    });

    const endedAt = new Date(checkpointReportedAtMs).toISOString();

    const { data: recordRows, error: recordError } = await serverDb.rpc(
      'persist_verified_standard_result_v2',
      {
        p_match_id: identity.matchId,
        p_mode: mode,
        p_result_reason: resultReason,
        p_wave: wave,
        p_elapsed_ms: Math.floor(officialElapsedMs),
        p_score: expectedScore,
        p_gold: gold,
        p_core_hp: coreHp,
        p_core_max_hp: coreMaxHp,
        p_kills: kills,
        p_started_at: identity.startedAt,
        p_ended_at: endedAt
      }
    );

    if (recordError) {
      console.error('Standard record persistence failed:', recordError.message);
      return res.status(500).json({ error: 'record_persist_failed' });
    }

    persistedRecord = Array.isArray(recordRows) ? recordRows[0] ?? null : recordRows;
    earnedShards = Number(persistedRecord?.earned_shards ?? 0);

    const profileRead = await req.db
      .from('profiles')
      .select('*')
      .eq('user_id', req.user.id)
      .single();

    if (profileRead.error || !profileRead.data) {
      return res.status(404).json({ error: 'profile_missing' });
    }
    savedProfile = profileRead.data;
  }

  if (mode === 'last-bastion') {
    const serverDb = clientForToken(req.accessToken, {
      'x-bastionfall-server-secret': matchTokenSecret
    });

    if (coreMaxHp > 28) {
      return res.status(400).json({ error: 'invalid_last_bastion_core_max_hp' });
    }

    const liveBounds = getStandardRunValidationBounds('last-bastion', identity.matchId, wave);
    if (kills > liveBounds.maxKills) {
      return res.status(400).json({ error: 'kills_exceed_wave_capacity' });
    }
    if (elapsedMs + 1500 < liveBounds.minElapsedMs) {
      return res.status(400).json({ error: 'elapsed_time_below_wave_minimum' });
    }

    const expectedScore = calculateRunScore({
      wave,
      elapsedMs,
      kills,
      coreHp,
      coreMaxHp
    }).totalScore;
    if (Math.floor(score) !== expectedScore) {
      return res.status(400).json({ error: 'score_mismatch' });
    }

    const endedAt = new Date(startedAtMs + elapsedMs).toISOString();

    const { data: statRows, error: statError } = await serverDb.rpc(
      'persist_verified_last_bastion_result_v3',
      {
        p_match_id: identity.matchId,
        p_result_reason: resultReason,
        p_wave: wave,
        p_elapsed_ms: Math.floor(elapsedMs),
        p_score: expectedScore,
        p_gold: gold,
        p_core_hp: coreHp,
        p_core_max_hp: coreMaxHp,
        p_kills: kills,
        p_started_at: identity.startedAt,
        p_ended_at: endedAt
      }
    );

    if (statError) {
      const message = String(statError.message || '');
      if (message.includes('last_bastion_match_not_found')) {
        return res.status(404).json({ error: 'last_bastion_match_not_found' });
      }
      if (message.includes('last_bastion_match_not_finished')) {
        return res.status(409).json({ error: 'last_bastion_match_not_finished' });
      }
      if (message.includes('last_bastion_placement_missing')) {
        return res.status(409).json({ error: 'last_bastion_placement_missing' });
      }
      if (
        message.includes('last_bastion_result_mismatch') ||
        message.includes('win_placement_mismatch') ||
        message.includes('last_bastion_wave_mismatch') ||
        message.includes('last_bastion_core_hp_mismatch') ||
        message.includes('last_bastion_core_max_hp_invalid')
      ) {
        return res.status(400).json({ error: 'last_bastion_result_mismatch' });
      }
      console.error('Last Bastion persistence failed:', statError.message);
      return res.status(500).json({ error: 'last_bastion_persist_failed' });
    }

    persistedRecord = Array.isArray(statRows) ? statRows[0] ?? null : statRows;
    earnedShards = Number(persistedRecord?.earned_shards ?? 0);

    const profileRead = await req.db
      .from('profiles')
      .select('*')
      .eq('user_id', req.user.id)
      .single();

    if (profileRead.error || !profileRead.data) return res.status(404).json({ error: 'profile_missing' });
    savedProfile = profileRead.data;
  }

  consumedMatchCompletions.set(completionKey, { touchedAtMs: Date.now() });

  res.json({
    accepted: true,
    matchId: identity.matchId,
    profile: savedProfile,
    earnedShards,
    record: persistedRecord,
    canonical: canonicalRun
  });
});

app.post('/api/fortress/upgrade', requireUser, (_req, res) => {
  res.status(410).json({
    error: 'permanent_combat_upgrades_disabled',
    message: 'Bastion combat power resets every run. Permanent fortress upgrades are disabled.'
  });
});

app.use(express.static(path.join(here, 'dist')));
app.get('/{*splat}', (_req, res) => res.sendFile(path.join(here, 'dist', 'index.html')));
app.listen(port, '0.0.0.0', () => console.log('Bastionfall server listening on', port));