import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHmac, randomUUID, timingSafeEqual } from 'node:crypto';
import { createClient } from '@supabase/supabase-js';

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
app.get('/api/config', (_req, res) => res.json({ startingGold: 240, baseHp: 20, waveBonus: 35, towerCap: 32 }));

const STARTABLE_MODES = new Set(['single-gate', 'tri-gate', 'last-bastion']);

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

app.get('/api/profile', requireUser, async (req, res) => {
  const { data, error } = await req.db.from('profiles').select('*').eq('user_id', req.user.id).maybeSingle();
  if (error) return res.status(500).json({ error: 'profile_read_failed' });
  if (data) return res.json({ profile: data });
  const fresh = { user_id: req.user.id, display_name: req.user.user_metadata?.full_name || 'Defender' };
  const created = await req.db.from('profiles').insert(fresh).select('*').single();
  if (created.error) return res.status(500).json({ error: 'profile_create_failed' });
  res.json({ profile: created.data });
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

    const matchInsert = await serverDb
      .from('completed_matches')
      .insert({
        user_id: req.user.id,
        mode,
        result_reason: resultReason,
        wave,
        elapsed_ms: Math.floor(elapsedMs),
        score: Math.floor(score),
        gold,
        core_hp: coreHp,
        core_max_hp: coreMaxHp,
        kills,
        started_at: identity.startedAt,
        ended_at: endedAt
      })
      .select('id')
      .single();

    if (matchInsert.error) {
      console.error('Completed match persistence failed:', matchInsert.error.message);
      return res.status(500).json({ error: 'completed_match_persist_failed' });
    }

    const currentRecord = await serverDb
      .from('mode_records')
      .select('*')
      .eq('user_id', req.user.id)
      .eq('mode', mode)
      .maybeSingle();

    if (currentRecord.error) {
      console.error('Mode record read failed:', currentRecord.error.message);
      return res.status(500).json({ error: 'mode_record_read_failed' });
    }

    const candidate = {
      best_wave: wave,
      best_survival_ms: Math.floor(elapsedMs),
      best_score: Math.floor(score),
      best_kills: kills
    };

    const currentBest = currentRecord.data;
    const candidateIsBetter =
      !currentBest ||
      candidate.best_wave > currentBest.best_wave ||
      (
        candidate.best_wave === currentBest.best_wave &&
        candidate.best_survival_ms > currentBest.best_survival_ms
      ) ||
      (
        candidate.best_wave === currentBest.best_wave &&
        candidate.best_survival_ms === currentBest.best_survival_ms &&
        candidate.best_score > currentBest.best_score
      );

    const nextRecord = currentBest
      ? {
          best_wave: candidateIsBetter ? candidate.best_wave : currentBest.best_wave,
          best_survival_ms: candidateIsBetter ? candidate.best_survival_ms : currentBest.best_survival_ms,
          best_score: candidateIsBetter ? candidate.best_score : currentBest.best_score,
          best_kills: Math.max(currentBest.best_kills || 0, candidate.best_kills)
        }
      : candidate;

    const recordWrite = currentBest
      ? await serverDb
          .from('mode_records')
          .update(nextRecord)
          .eq('user_id', req.user.id)
          .eq('mode', mode)
          .select('*')
          .single()
      : await serverDb
          .from('mode_records')
          .insert({ user_id: req.user.id, mode, ...nextRecord })
          .select('*')
          .single();

    if (recordWrite.error) {
      console.error('Mode record persistence failed:', recordWrite.error.message);
      return res.status(500).json({ error: 'mode_record_persist_failed' });
    }

    persistedRecord = {
      completedMatchId: matchInsert.data.id,
      ...recordWrite.data
    };
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