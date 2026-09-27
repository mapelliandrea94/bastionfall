import { ARCHER_TOWER } from '../towers/archer.js';
import { CANNON_TOWER } from '../towers/cannon.js';
import { FROST_TOWER } from '../towers/frost.js';
import { MAGE_TOWER } from '../towers/mage.js';
import { BALLISTA_TOWER } from '../towers/ballista.js';
import { BARRACKS } from '../structures/barracks.js';
import { composeWaveByThreatBudget, getWaveThreatBudget } from './waveThreat.js';
import { TRI_GATE_PACING, getTriGateWaveClearReward, getTriGateWaveScaling } from './triGatePacing.js';
import { distributeTriGateWave } from '../spawning/triGateSpawn.js';

const DEFENSES = Object.freeze([
  ARCHER_TOWER,
  CANNON_TOWER,
  FROST_TOWER,
  MAGE_TOWER,
  BALLISTA_TOWER,
  BARRACKS
]);

function getOpeningAffordability() {
  return Object.freeze(
    DEFENSES.map((defense) => Object.freeze({
      id: defense.id,
      cost: defense.cost,
      maxCopies: Math.floor(TRI_GATE_PACING.startingGold / defense.cost),
      remainingAfterOne: TRI_GATE_PACING.startingGold - defense.cost
    }))
  );
}

function getWaveSnapshot(waveNumber) {
  const singleBudget = getWaveThreatBudget(waveNumber);
  const triWave = composeWaveByThreatBudget(waveNumber, TRI_GATE_PACING.threatMultiplier);
  const distribution = distributeTriGateWave(triWave.composition, waveNumber);
  const laneThreats = distribution.lanes.map((lane) => lane.threat);
  const scaling = getTriGateWaveScaling(waveNumber);

  return Object.freeze({
    waveNumber,
    singleBudget,
    triBudget: triWave.budget,
    enemyCount: triWave.enemyCount,
    laneThreats: Object.freeze(laneThreats),
    laneThreatSpread: Number((Math.max(...laneThreats) - Math.min(...laneThreats)).toFixed(2)),
    waveReward: getTriGateWaveClearReward(waveNumber),
    spawnIntervalMs: scaling.spawnIntervalMs,
    travelDurationMs: scaling.travelDurationMs
  });
}

export function getTriGateBalanceSmokeTest() {
  const affordability = getOpeningAffordability();
  const byId = Object.fromEntries(affordability.map((entry) => [entry.id, entry]));
  const wave1 = getWaveSnapshot(1);
  const wave6 = getWaveSnapshot(6);
  const wave11 = getWaveSnapshot(11);
  const wave21 = getWaveSnapshot(21);

  const checkpoints = Object.freeze([wave1, wave6, wave11, wave21]);

  return Object.freeze({
    affordability,
    checkpoints,
    checks: Object.freeze({
      openingCanCoverThreeFronts:
        (byId.archer?.maxCopies ?? 0) >= 4 &&
        (byId.cannon?.maxCopies ?? 0) >= 2,
      openingStillRequiresChoices:
        (byId.ballista?.maxCopies ?? 99) <= 2 &&
        (byId.barracks?.maxCopies ?? 99) <= 2,
      threatActuallyHigherThanSingle:
        checkpoints.every((checkpoint) => checkpoint.triBudget > checkpoint.singleBudget),
      rewardCurveIncreases:
        wave1.waveReward < wave6.waveReward &&
        wave6.waveReward <= wave11.waveReward &&
        wave11.waveReward <= wave21.waveReward,
      laneThreatReasonable:
        checkpoints.every((checkpoint) => checkpoint.laneThreatSpread <= 2.4),
      pacingMonotonic:
        wave1.spawnIntervalMs > wave6.spawnIntervalMs &&
        wave6.spawnIntervalMs > wave11.spawnIntervalMs &&
        wave11.spawnIntervalMs > wave21.spawnIntervalMs &&
        wave1.travelDurationMs > wave6.travelDurationMs &&
        wave6.travelDurationMs > wave11.travelDurationMs &&
        wave11.travelDurationMs > wave21.travelDurationMs
    })
  });
}
