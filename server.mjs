import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createClient } from '@supabase/supabase-js';

const app = express();
const port = Number(process.env.PORT || 3000);
const here = path.dirname(fileURLToPath(import.meta.url));
const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseSecret = process.env.SUPABASE_SECRET_KEY || '';
const admin = supabaseUrl && supabaseSecret
  ? createClient(supabaseUrl, supabaseSecret, { auth: { persistSession: false } })
  : null;

app.use(express.json({ limit: '64kb' }));

async function requireUser(req, res, next) {
  if (!admin) return res.status(503).json({ error: 'server_not_configured' });
  const token = String(req.headers.authorization || '').replace(/^Bearer\s+/i, '');
  if (!token) return res.status(401).json({ error: 'missing_token' });
  const { data, error } = await admin.auth.getUser(token);
  if (error || !data.user) return res.status(401).json({ error: 'invalid_token' });
  req.user = data.user;
  next();
}

app.get('/api/health', (_req, res) => res.json({ ok: true, game: 'Bastionfall', version: '0.1.0' }));
app.get('/api/config', (_req, res) => res.json({ startingGold: 240, baseHp: 20, waveBonus: 35, towerCap: 32 }));

app.get('/api/profile', requireUser, async (req, res) => {
  const { data, error } = await admin.from('profiles').select('*').eq('user_id', req.user.id).maybeSingle();
  if (error) return res.status(500).json({ error: 'profile_read_failed' });
  if (data) return res.json({ profile: data });
  const fresh = { user_id: req.user.id, display_name: req.user.user_metadata?.full_name || 'Defender' };
  const created = await admin.from('profiles').insert(fresh).select('*').single();
  if (created.error) return res.status(500).json({ error: 'profile_create_failed' });
  res.json({ profile: created.data });
});

app.post('/api/run/complete', requireUser, async (req, res) => {
  const wave = Math.max(0, Math.min(9999, Number(req.body?.wave || 0)));
  const kills = Math.max(0, Math.min(1000000, Number(req.body?.kills || 0)));
  const shards = Math.max(1, Math.floor(wave / 2));
  const { data: current } = await admin.from('profiles').select('*').eq('user_id', req.user.id).single();
  if (!current) return res.status(404).json({ error: 'profile_missing' });
  const patch = {
    best_wave: Math.max(current.best_wave || 0, wave),
    shards: (current.shards || 0) + shards,
    runs: (current.runs || 0) + 1,
    lifetime_kills: (current.lifetime_kills || 0) + kills,
    updated_at: new Date().toISOString()
  };
  const saved = await admin.from('profiles').update(patch).eq('user_id', req.user.id).select('*').single();
  if (saved.error) return res.status(500).json({ error: 'progress_save_failed' });
  res.json({ profile: saved.data, earnedShards: shards });
});

app.post('/api/fortress/upgrade', requireUser, async (req, res) => {
  const { data: current } = await admin.from('profiles').select('*').eq('user_id', req.user.id).single();
  if (!current) return res.status(404).json({ error: 'profile_missing' });
  const cost = Math.max(40, (current.fortress_level || 1) * 40);
  if ((current.shards || 0) < cost) return res.status(400).json({ error: 'not_enough_shards', cost });
  const saved = await admin.from('profiles').update({
    fortress_level: (current.fortress_level || 1) + 1,
    shards: current.shards - cost,
    updated_at: new Date().toISOString()
  }).eq('user_id', req.user.id).select('*').single();
  if (saved.error) return res.status(500).json({ error: 'upgrade_failed' });
  res.json({ profile: saved.data });
});

app.use(express.static(path.join(here, 'dist')));
app.get('/{*splat}', (_req, res) => res.sendFile(path.join(here, 'dist', 'index.html')));
app.listen(port, '0.0.0.0', () => console.log('Bastionfall server listening on', port));