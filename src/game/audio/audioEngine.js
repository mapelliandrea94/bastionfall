import { subscribeGameFeedback } from '../feedback/gameFeedback.js';

const STORAGE_KEY = 'bastionfall.audio.v1';

const DEFAULTS = Object.freeze({
  master: 80,
  music: 45,
  effects: 80,
  muted: false
});

let settings = loadSettings();
let audioContext = null;
let masterGain = null;
let musicGain = null;
let effectsGain = null;
let ambientNodes = [];
let lastAttackAt = 0;
let initialized = false;

function clampVolume(value) {
  return Math.max(0, Math.min(100, Math.round(Number(value) || 0)));
}

function loadSettings() {
  if (typeof window === 'undefined') return { ...DEFAULTS };
  try {
    const saved = JSON.parse(window.localStorage.getItem(STORAGE_KEY) || '{}');
    return {
      master: clampVolume(saved.master ?? DEFAULTS.master),
      music: clampVolume(saved.music ?? DEFAULTS.music),
      effects: clampVolume(saved.effects ?? DEFAULTS.effects),
      muted: Boolean(saved.muted ?? DEFAULTS.muted)
    };
  } catch {
    return { ...DEFAULTS };
  }
}

function persistSettings() {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
}

function gainValue(percent) {
  const normalized = clampVolume(percent) / 100;
  return normalized * normalized;
}

function applyVolumes() {
  if (!audioContext || !masterGain || !musicGain || !effectsGain) return;
  const now = audioContext.currentTime;
  masterGain.gain.setTargetAtTime(settings.muted ? 0 : gainValue(settings.master), now, 0.025);
  musicGain.gain.setTargetAtTime(gainValue(settings.music), now, 0.025);
  effectsGain.gain.setTargetAtTime(gainValue(settings.effects), now, 0.025);
}

function ensureAudio() {
  if (typeof window === 'undefined') return null;
  if (!audioContext) {
    const Context = window.AudioContext || window.webkitAudioContext;
    if (!Context) return null;
    audioContext = new Context();
    masterGain = audioContext.createGain();
    musicGain = audioContext.createGain();
    effectsGain = audioContext.createGain();
    musicGain.connect(masterGain);
    effectsGain.connect(masterGain);
    masterGain.connect(audioContext.destination);
    applyVolumes();
    startAmbientBed();
  }
  if (audioContext.state === 'suspended') audioContext.resume().catch(() => {});
  return audioContext;
}

function tone({
  frequency = 220,
  frequencyEnd = null,
  duration = 0.12,
  gain = 0.12,
  type = 'sine',
  delay = 0
} = {}) {
  const ctx = ensureAudio();
  if (!ctx || !effectsGain || settings.muted) return;
  const start = ctx.currentTime + delay;
  const oscillator = ctx.createOscillator();
  const envelope = ctx.createGain();
  oscillator.type = type;
  oscillator.frequency.setValueAtTime(Math.max(20, frequency), start);
  if (frequencyEnd != null) {
    oscillator.frequency.exponentialRampToValueAtTime(Math.max(20, frequencyEnd), start + duration);
  }
  envelope.gain.setValueAtTime(0.0001, start);
  envelope.gain.exponentialRampToValueAtTime(Math.max(0.0001, gain), start + 0.008);
  envelope.gain.exponentialRampToValueAtTime(0.0001, start + duration);
  oscillator.connect(envelope);
  envelope.connect(effectsGain);
  oscillator.start(start);
  oscillator.stop(start + duration + 0.03);
}

function noise({ duration = 0.1, gain = 0.08, delay = 0, lowpass = 1800 } = {}) {
  const ctx = ensureAudio();
  if (!ctx || !effectsGain || settings.muted) return;
  const frameCount = Math.max(1, Math.floor(ctx.sampleRate * duration));
  const buffer = ctx.createBuffer(1, frameCount, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < frameCount; i += 1) data[i] = Math.random() * 2 - 1;
  const source = ctx.createBufferSource();
  const filter = ctx.createBiquadFilter();
  const envelope = ctx.createGain();
  const start = ctx.currentTime + delay;
  filter.type = 'lowpass';
  filter.frequency.value = lowpass;
  envelope.gain.setValueAtTime(Math.max(0.0001, gain), start);
  envelope.gain.exponentialRampToValueAtTime(0.0001, start + duration);
  source.buffer = buffer;
  source.connect(filter);
  filter.connect(envelope);
  envelope.connect(effectsGain);
  source.start(start);
}

function chord(notes, options = {}) {
  notes.forEach((frequency, index) => tone({ frequency, delay: index * 0.035, ...options }));
}

export function playUiSound(kind = 'click') {
  if (kind === 'confirm') {
    tone({ frequency: 420, frequencyEnd: 650, duration: 0.11, gain: 0.07, type: 'triangle' });
    return;
  }
  tone({ frequency: 280, frequencyEnd: 340, duration: 0.055, gain: 0.045, type: 'triangle' });
}

export function playTowerAttackSound(definition = {}) {
  const now = typeof performance !== 'undefined' ? performance.now() : Date.now();
  if (now - lastAttackAt < 34) return;
  lastAttackAt = now;

  const type = definition.damageType;
  if (type === 'frost') {
    tone({ frequency: 760, frequencyEnd: 420, duration: 0.07, gain: 0.032, type: 'sine' });
  } else if (type === 'arcane') {
    tone({ frequency: 520, frequencyEnd: 900, duration: 0.065, gain: 0.03, type: 'sawtooth' });
  } else if (type === 'piercing') {
    tone({ frequency: 180, frequencyEnd: 90, duration: 0.09, gain: 0.04, type: 'square' });
  } else {
    noise({ duration: 0.045, gain: 0.028, lowpass: 1200 });
  }
}

function playFeedbackSound(sound) {
  switch (sound) {
    case 'wave-start':
      chord([220, 330, 440], { duration: 0.18, gain: 0.055, type: 'triangle' });
      break;
    case 'boss-warning':
      tone({ frequency: 96, frequencyEnd: 58, duration: 0.55, gain: 0.16, type: 'sawtooth' });
      noise({ duration: 0.35, gain: 0.07, lowpass: 500 });
      break;
    case 'tower-build':
      noise({ duration: 0.08, gain: 0.065, lowpass: 900 });
      tone({ frequency: 150, frequencyEnd: 230, duration: 0.09, gain: 0.045, type: 'triangle' });
      break;
    case 'tower-evolution':
      chord([330, 440, 660, 880], { duration: 0.34, gain: 0.07, type: 'triangle' });
      break;
    case 'bastion-hit':
      tone({ frequency: 105, frequencyEnd: 55, duration: 0.16, gain: 0.11, type: 'square' });
      noise({ duration: 0.12, gain: 0.055, lowpass: 650 });
      break;
    case 'bastion-low-hp':
      tone({ frequency: 180, duration: 0.12, gain: 0.09, type: 'square' });
      tone({ frequency: 180, duration: 0.12, gain: 0.09, type: 'square', delay: 0.19 });
      break;
    case 'player-eliminated':
      tone({ frequency: 260, frequencyEnd: 70, duration: 0.6, gain: 0.12, type: 'sawtooth' });
      break;
    case 'spectate-start':
      tone({ frequency: 360, frequencyEnd: 520, duration: 0.16, gain: 0.05, type: 'triangle' });
      break;
    case 'victory':
      chord([392, 494, 587, 784], { duration: 0.45, gain: 0.085, type: 'triangle' });
      break;
    case 'personal-best':
      chord([523, 659, 784], { duration: 0.32, gain: 0.08, type: 'sine' });
      break;
    default:
      break;
  }
}

function startAmbientBed() {
  const ctx = audioContext;
  if (!ctx || ambientNodes.length > 0) return;

  const filter = ctx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.value = 360;
  filter.Q.value = 0.7;
  filter.connect(musicGain);

  [55, 82.41, 110].forEach((frequency, index) => {
    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();
    oscillator.type = index === 0 ? 'sine' : 'triangle';
    oscillator.frequency.value = frequency;
    gain.gain.value = index === 0 ? 0.035 : 0.012;
    oscillator.connect(gain);
    gain.connect(filter);
    oscillator.start();
    ambientNodes.push(oscillator, gain);
  });
  ambientNodes.push(filter);
}

export function getAudioSettings() {
  return Object.freeze({ ...settings });
}

export function setAudioSetting(key, value) {
  if (!['master', 'music', 'effects'].includes(key)) return getAudioSettings();
  settings = { ...settings, [key]: clampVolume(value) };
  persistSettings();
  applyVolumes();
  ensureAudio();
  return getAudioSettings();
}

export function setAudioMuted(muted) {
  settings = { ...settings, muted: Boolean(muted) };
  persistSettings();
  applyVolumes();
  return getAudioSettings();
}

export function initAudioEngine() {
  if (initialized || typeof window === 'undefined') return;
  initialized = true;

  const unlock = () => ensureAudio();
  window.addEventListener('pointerdown', unlock, { once: true, passive: true });
  window.addEventListener('keydown', unlock, { once: true });

  subscribeGameFeedback((payload) => playFeedbackSound(payload?.cue?.sound));
}
