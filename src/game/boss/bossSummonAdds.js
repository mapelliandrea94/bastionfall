import { isBossWave } from './bossSchedule.js';

export const BOSS_SUMMON_ADDS = Object.freeze({
  version: 1,
  pulseOffsetsMs: Object.freeze([6500, 13500]),
  baseAddsPerPulse: 2,
  maxAddsPerPulse: 4,
  archetypeCycle: Object.freeze(['runner', 'normal', 'shielded'])
});

function normalizeWaveNumber(waveNumber) {
  return Math.max(1, Math.floor(Number(waveNumber) || 1));
}

export function getBossSummonAddsPlan(waveNumber) {
  const wave = normalizeWaveNumber(waveNumber);
  if (!isBossWave(wave)) {
    return Object.freeze({
      waveNumber: wave,
      active: false,
      pulses: Object.freeze([])
    });
  }

  const bossIndex = Math.max(1, Math.floor(wave / 10));
  const addsPerPulse = Math.min(
    BOSS_SUMMON_ADDS.maxAddsPerPulse,
    BOSS_SUMMON_ADDS.baseAddsPerPulse + Math.floor((bossIndex - 1) / 2)
  );

  const pulses = BOSS_SUMMON_ADDS.pulseOffsetsMs.map((offsetMs, pulseIndex) => {
    const adds = Array.from({ length: addsPerPulse }, (_, addIndex) => {
      const archetype = BOSS_SUMMON_ADDS.archetypeCycle[
        (bossIndex + pulseIndex + addIndex - 1) % BOSS_SUMMON_ADDS.archetypeCycle.length
      ];

      return Object.freeze({
        id: `boss-${wave}-summon-${pulseIndex + 1}-${addIndex + 1}`,
        archetype,
        threatValue: archetype === 'shielded' ? 2.15 : archetype === 'runner' ? 0.9 : 1,
        source: 'boss-summon'
      });
    });

    return Object.freeze({
      pulseIndex,
      offsetMs,
      adds: Object.freeze(adds)
    });
  });

  return Object.freeze({
    waveNumber: wave,
    active: true,
    bossIndex,
    addsPerPulse,
    totalAdds: addsPerPulse * pulses.length,
    pulses: Object.freeze(pulses)
  });
}

export function getBossSummonAddsFixtures() {
  const normalWave = getBossSummonAddsPlan(9);
  const firstBoss = getBossSummonAddsPlan(10);
  const laterBoss = getBossSummonAddsPlan(30);

  return Object.freeze({
    normalWaveInactive: normalWave.active === false && normalWave.pulses.length === 0,
    firstBossActive: firstBoss.active === true,
    firstBossPulseCountExpected: 2,
    firstBossPulseCountActual: firstBoss.pulses.length,
    firstBossAddsPerPulseExpected: 2,
    firstBossAddsPerPulseActual: firstBoss.addsPerPulse,
    laterBossScalesAdds: laterBoss.addsPerPulse > firstBoss.addsPerPulse,
    idsUnique:
      new Set(firstBoss.pulses.flatMap((pulse) => pulse.adds.map((add) => add.id))).size ===
      firstBoss.totalAdds,
    sourceTagged: firstBoss.pulses.every((pulse) =>
      pulse.adds.every((add) => add.source === 'boss-summon')
    )
  });
}
