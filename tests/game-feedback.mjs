import {
  GAME_FEEDBACK_CUES,
  GAME_FEEDBACK_EVENTS,
  getGameFeedbackFixtures
} from '../src/game/feedback/gameFeedback.js';

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const fixture = getGameFeedbackFixtures();

assert(fixture.eventCount === 10, 'Expected 10 core gameplay feedback events');
assert(fixture.allCuesMapped, 'Every feedback event must map to a sound cue');
assert(fixture.allPrioritiesValid, 'Every feedback cue must have an integer priority');
assert(fixture.uniqueEvents, 'Feedback event names must be unique');
assert(GAME_FEEDBACK_CUES[GAME_FEEDBACK_EVENTS.BOSS_WAVE].priority === 3, 'Boss warning must be high priority');
assert(GAME_FEEDBACK_CUES[GAME_FEEDBACK_EVENTS.LAST_BASTION_WIN].sound === 'victory', 'Last Bastion win must map to victory cue');

console.log('Gameplay feedback QA PASS', fixture);
