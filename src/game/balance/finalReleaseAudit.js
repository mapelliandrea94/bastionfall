import { TFT_SHOP } from '../tft/tftShop.js';
import {
  getSuddenSiegeEconomyParity,
  getSuddenSiegeWaveScaling,
  getSuddenSiegeWaveReward
} from './suddenSiege.js';
import { getRiskRewardConfig, applyRiskRewardGold } from './riskReward.js';
import { getStackedTowerPowerAuditPass } from './stackedTowerPowerAudit.js';
import { getEvolutionFixtures } from '../towers/evolutions.js';
import { getTowerSynergyFixtures } from '../towers/towerSynergies.js';
import { getBlessingEngineFixtures } from '../blessings/blessingEngine.js';
import { getMiniObjectiveFixtures } from '../objectives/miniObjectives.js';
import { getLeaderboardPresentationFixtures } from '../records/leaderboardPresentation.js';

const MODES = Object.freeze([
  'single-gate',
  'tri-gate',
  'tft-shop',
  'sudden-siege',
  'last-bastion'
]);

export function getFinalReleaseAudit() {
  const evolution = getEvolutionFixtures();
  const synergy = getTowerSynergyFixtures();
  const blessing = getBlessingEngineFixtures();
  const mini = getMiniObjectiveFixtures();
  const leaderboard = getLeaderboardPresentationFixtures();

  const suddenParityWaves = [1, 5, 8, 12, 15, 20, 25, 50];
  const suddenParity = suddenParityWaves.every((wave) =>
    getSuddenSiegeEconomyParity(wave, TFT_SHOP).exactParity
  );

  const suddenPressure = getRiskRewardConfig('sudden-siege', 'pressure');
  const suddenPressureCeiling = [3, 10, 18, 25].every((wave) => {
    const scaling = getSuddenSiegeWaveScaling(wave);
    return scaling.suddenThreatMultiplier * suddenPressure.threatMultiplier <= 1.70;
  });

  const riskRewardModesValid = MODES.every((mode) => {
    const config = getRiskRewardConfig(mode, 'pressure');
    return Number.isFinite(config.threatMultiplier) &&
      Number.isFinite(config.rewardMultiplier) &&
      Number.isFinite(config.flatGoldBonus) &&
      config.threatMultiplier >= 1 &&
      applyRiskRewardGold(5, mode, 'pressure') >= 0;
  });

  const checks = Object.freeze({
    allFiveModesHaveRiskRewardConfig: riskRewardModesValid,
    allTwentyFourEvolutionsPresent: evolution.evolutionCountActual === 24,
    everyTowerHasTwoEvolutionChoices: evolution.everyTowerHasTwoChoices === true,
    stackedTowerAuditPass: getStackedTowerPowerAuditPass() === true,
    humanSynergyThresholdWorks: synergy.humanActivatesAtThree === true,
    neutralSynergyThresholdWorks: synergy.neutralActivatesAtTwo === true,
    identityBlessingsWork: blessing.humanDoctrineBoostsHuman === true && blessing.alienOvermindAddsRangeAndChain === true,
    miniObjectiveRotationWorks:
      mini.wave1Flawless === true &&
      mini.wave6Lean === true &&
      mini.wave11FactionFocus === true &&
      mini.wave16Pressure === true &&
      mini.wave21WarChest === true &&
      mini.wave26Evolved === true &&
      mini.rotatesEveryFive === true,
    shopMiniRewardsStaySmall: mini.tftReward === true && mini.suddenReward === true,
    topTenPresentationWorks: leaderboard.podiumHasThree === true && leaderboard.personalTopTenDetected === true,
    suddenBaseEconomyMatchesTft: suddenParity,
    suddenPressureCeilingRespected: suddenPressureCeiling,
    suddenRewardMatchesTft:
      getSuddenSiegeWaveReward(1) === TFT_SHOP.waveClearGold &&
      getSuddenSiegeWaveReward(25) === TFT_SHOP.waveClearGold
  });

  return Object.freeze({
    checks,
    pass: Object.values(checks).every(Boolean)
  });
}
