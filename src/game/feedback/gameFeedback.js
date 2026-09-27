export const GAME_FEEDBACK_EVENTS = Object.freeze({
  WAVE_START: 'wave-start',
  BOSS_WAVE: 'boss-wave',
  TOWER_BUILT: 'tower-built',
  TOWER_EVOLVED: 'tower-evolved',
  BASTION_HIT: 'bastion-hit',
  BASTION_LOW_HP: 'bastion-low-hp',
  PLAYER_ELIMINATED: 'player-eliminated',
  SPECTATE_START: 'spectate-start',
  LAST_BASTION_WIN: 'last-bastion-win',
  PERSONAL_BEST: 'personal-best'
});

export const GAME_FEEDBACK_CUES = Object.freeze({
  [GAME_FEEDBACK_EVENTS.WAVE_START]: Object.freeze({ sound: 'wave-start', priority: 1 }),
  [GAME_FEEDBACK_EVENTS.BOSS_WAVE]: Object.freeze({ sound: 'boss-warning', priority: 3 }),
  [GAME_FEEDBACK_EVENTS.TOWER_BUILT]: Object.freeze({ sound: 'tower-build', priority: 1 }),
  [GAME_FEEDBACK_EVENTS.TOWER_EVOLVED]: Object.freeze({ sound: 'tower-evolution', priority: 2 }),
  [GAME_FEEDBACK_EVENTS.BASTION_HIT]: Object.freeze({ sound: 'bastion-hit', priority: 2 }),
  [GAME_FEEDBACK_EVENTS.BASTION_LOW_HP]: Object.freeze({ sound: 'bastion-low-hp', priority: 3 }),
  [GAME_FEEDBACK_EVENTS.PLAYER_ELIMINATED]: Object.freeze({ sound: 'player-eliminated', priority: 2 }),
  [GAME_FEEDBACK_EVENTS.SPECTATE_START]: Object.freeze({ sound: 'spectate-start', priority: 1 }),
  [GAME_FEEDBACK_EVENTS.LAST_BASTION_WIN]: Object.freeze({ sound: 'victory', priority: 3 }),
  [GAME_FEEDBACK_EVENTS.PERSONAL_BEST]: Object.freeze({ sound: 'personal-best', priority: 2 })
});

const TARGET = typeof window !== 'undefined' ? window : null;
const EVENT_NAME = 'bastionfall:feedback';

export function emitGameFeedback(type, detail = {}) {
  const cue = GAME_FEEDBACK_CUES[type] ?? Object.freeze({ sound: null, priority: 0 });
  const payload = Object.freeze({
    type,
    cue,
    timestamp: Date.now(),
    ...detail
  });

  if (TARGET && typeof TARGET.dispatchEvent === 'function') {
    TARGET.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: payload }));
  }

  return payload;
}

export function subscribeGameFeedback(listener) {
  if (!TARGET || typeof listener !== 'function') return () => {};
  const handler = (event) => listener(event.detail);
  TARGET.addEventListener(EVENT_NAME, handler);
  return () => TARGET.removeEventListener(EVENT_NAME, handler);
}

export function getGameFeedbackFixtures() {
  const required = [
    GAME_FEEDBACK_EVENTS.WAVE_START,
    GAME_FEEDBACK_EVENTS.BOSS_WAVE,
    GAME_FEEDBACK_EVENTS.TOWER_BUILT,
    GAME_FEEDBACK_EVENTS.TOWER_EVOLVED,
    GAME_FEEDBACK_EVENTS.BASTION_HIT,
    GAME_FEEDBACK_EVENTS.BASTION_LOW_HP,
    GAME_FEEDBACK_EVENTS.PLAYER_ELIMINATED,
    GAME_FEEDBACK_EVENTS.SPECTATE_START,
    GAME_FEEDBACK_EVENTS.LAST_BASTION_WIN,
    GAME_FEEDBACK_EVENTS.PERSONAL_BEST
  ];

  return Object.freeze({
    eventCount: required.length,
    allCuesMapped: required.every((event) => Boolean(GAME_FEEDBACK_CUES[event]?.sound)),
    allPrioritiesValid: required.every((event) => Number.isInteger(GAME_FEEDBACK_CUES[event]?.priority)),
    uniqueEvents: new Set(required).size === required.length
  });
}
