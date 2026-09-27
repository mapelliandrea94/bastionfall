import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHmac, randomUUID, timingSafeEqual } from 'node:crypto';
import { createClient } from '@supabase/supabase-js';
import { getLastBastionMatchmakingFixtures, getLastBastionQueueStatus, joinLastBastionQueue, leaveLastBastionQueue, setLastBastionReady } from './server/lastBastionMatchmaking.js';

const app = express();
const port = Number(process.env.PORT || 3000);
const here = path.dirname(fileURLToPath(import.meta.url));
const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_PUBLISHABLE_KEY || '';
const matchTokenSecret = process.env.MATCH_TOKEN_SECRET || '';

app.use(express.json({ limit: '64kb' }));

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

app.post('/api/match/start', requireUser, (req, res) => {
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

app.post('/api/last-bastion/matchmaking/join', requireUser, (req, res) => {
  const result = joinLastBastionQueue(req.user.id);
  if (!result.ok) return res.status(400).json({ error: result.error || 'matchmaking_join_failed' });
  return res.status(result.created ? 201 : 200).json(result);
});

app.post('/api/last-bastion/matchmaking/leave', requireUser, (req, res) => {
  return res.json(leaveLastBastionQueue(req.user.id));
});

app.post('/api/last-bastion/matchmaking/ready', requireUser, (req, res) => {
  const result = setLastBastionReady(req.user.id, req.body?.ready !== false);
  if (!result.ok) return res.status(400).json({ error: result.error || 'matchmaking_ready_failed' });
  return res.json(attachLastBastionMatchToken(result, req.user.id));
});

app.get('/api/last-bastion/matchmaking/status', requireUser, (req, res) => {
  return res.json(attachLastBastionMatchToken(getLastBastionQueueStatus(req.user.id), req.user.id));
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
      .select('runs,best_wave,best_survival_ms,best_score,lifetime_kills,total_survival_ms,updated_at')
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

app.post('/api/run/complete', requireUser, async (req, res) => {
  const matchToken = String(req.body?.matchToken || '');
  const identity = verifyMatchIdentity(matchToken);
  if (!identity) return res.status(400).json({ error: 'invalid_match_token' });
  if (identity.userId !== req.user.id) return res.status(403).json({ error: 'match_user_mismatch' });

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
  if (!['bastion-destroyed', 'player-exit'].includes(resultReason)) {
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
  if (mode === 'single-gate' || mode === 'tri-gate') {
    const serverDb = clientForToken(req.accessToken, {
      'x-bastionfall-server-secret': matchTokenSecret
    });
    const endedAt = new Date(startedAtMs + elapsedMs).toISOString();

    const { data: recordRows, error: recordError } = await serverDb.rpc(
      'persist_verified_standard_result',
      {
        p_mode: mode,
        p_result_reason: resultReason,
        p_wave: wave,
        p_elapsed_ms: Math.floor(elapsedMs),
        p_score: Math.floor(score),
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

  if (mode === 'last-bastion') {
    const serverDb = clientForToken(req.accessToken, {
      'x-bastionfall-server-secret': matchTokenSecret
    });
    const endedAt = new Date(startedAtMs + elapsedMs).toISOString();

    const { data: statRows, error: statError } = await serverDb.rpc(
      'persist_verified_last_bastion_result',
      {
        p_result_reason: resultReason,
        p_wave: wave,
        p_elapsed_ms: Math.floor(elapsedMs),
        p_score: Math.floor(score),
        p_gold: gold,
        p_core_hp: coreHp,
        p_core_max_hp: coreMaxHp,
        p_kills: kills,
        p_started_at: identity.startedAt,
        p_ended_at: endedAt
      }
    );

    if (statError) {
      console.error('Last Bastion persistence failed:', statError.message);
      return res.status(500).json({ error: 'last_bastion_persist_failed' });
    }

    persistedRecord = Array.isArray(statRows) ? statRows[0] ?? null : statRows;
  }

    persistedRecord = Array.isArray(recordRows) ? recordRows[0] ?? null : recordRows;
  }

  const { data: current, error: profileError } = await req.db
    .from('profiles')
    .select('*')
    .eq('user_id', req.user.id)
    .single();

  if (profileError || !current) return res.status(404).json({ error: 'profile_missing' });

  const shards = Math.max(1, Math.floor(wave / 2));
  const patch = {
    best_wave: Math.max(current.best_wave || 0, wave),
    shards: (current.shards || 0) + shards,
    runs: (current.runs || 0) + 1,
    lifetime_kills: (current.lifetime_kills || 0) + kills,
    updated_at: new Date().toISOString()
  };

  const saved = await req.db
    .from('profiles')
    .update(patch)
    .eq('user_id', req.user.id)
    .select('*')
    .single();

  if (saved.error) return res.status(500).json({ error: 'progress_save_failed' });

  res.json({
    accepted: true,
    matchId: identity.matchId,
    profile: saved.data,
    earnedShards: shards,
    record: persistedRecord
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