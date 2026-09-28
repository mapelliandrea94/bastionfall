import assert from 'node:assert/strict';
import { getLeaderboardPresentation } from '../src/game/records/leaderboardPresentation.js';

const entries = [
  { displayName: 'One', bestWave: 30, isSelf: false },
  { displayName: 'You', bestWave: 27, isSelf: true },
  { displayName: 'Three', bestWave: 25, isSelf: false },
  { displayName: 'Four', bestWave: 20, isSelf: false }
];

const view = getLeaderboardPresentation(entries, { displayName: 'You', bestWave: 27, isSelf: true });
assert.equal(view.podium.length, 3);
assert.equal(view.podium[0].medal, 'gold');
assert.equal(view.podium[1].medal, 'silver');
assert.equal(view.podium[2].medal, 'bronze');
assert.equal(view.personal.rank, 2);
assert.equal(view.personal.isTopTen, true);

const outside = getLeaderboardPresentation(entries.map((entry) => ({ ...entry, isSelf: false })), { displayName: 'Outside', bestWave: 12, isSelf: true });
assert.equal(outside.personal.rank, null);
assert.equal(outside.personal.isTopTen, false);

console.log('LEADERBOARD_RECORDS_POLISH_PASS');
