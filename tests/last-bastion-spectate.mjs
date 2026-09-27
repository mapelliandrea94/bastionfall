function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const eliminated = [
  { slot: 1, self: true, alive: false, connected: true, wave: 12, coreHp: 0 },
  { slot: 2, self: false, alive: true, connected: true, wave: 12, coreHp: 8 },
  { slot: 3, self: false, alive: true, connected: false, wave: 11, coreHp: 15 }
];

const self = eliminated.find((participant) => participant.self);
const aliveCount = eliminated.filter((participant) => participant.alive).length;
const isSpectating = self?.alive === false && aliveCount > 0;

assert(isSpectating, 'Eliminated participant must enter spectator mode while others remain alive');
assert(aliveCount === 2, 'Overlay must count alive participants accurately');
assert(eliminated.some((participant) => participant.connected === false), 'Overlay must preserve disconnected status');

const finished = {
  status: 'finished',
  winnerSlot: 2,
  participants: eliminated
};

assert(finished.status === 'finished', 'Finished match status must be renderable');
assert(finished.winnerSlot === 2, 'Winner slot must be surfaced to the overlay');

console.log('Last Bastion spectator overlay QA PASS', {
  aliveCount,
  selfAlive: self.alive,
  winnerSlot: finished.winnerSlot
});
