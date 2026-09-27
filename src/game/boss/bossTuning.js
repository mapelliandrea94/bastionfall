import { getBossProfileForWave, isBossWave } from './bossSchedule.js';
import { getBossArmorForIndex } from './bossArmorEnrage.js';
import { getBossSummonAddsPlan } from './bossSummonAdds.js';

const BOSS_TAG_ROTATION = Object.freeze([
  Object.freeze({ faction: 'human', unitType: 'armored' }),
  Object.freeze({ faction: 'insect', unitType: 'infantry' }),
  Object.freeze({ faction: 'alien', unitType: 'air' })
]);

export const BOSS_TUNING = Object.freeze({
  version: 1,
  baseHp: 2200,
  hpGrowthPerBoss: 0.42,
  baseMoveSpeed: 0.62,
  moveSpeedGrowthPerBoss: 0.03,
  maxMoveSpeed: 0.82,
  baseBastionDamage: 4,
  damageGrowthEveryTwoBosses: 1,
  baseGoldReward: 30,
  goldRewardPerBoss: 10
});

function normalizeBossIndex(value) {
  return Math.max(1, Math.floor(Number(value) || 1));
}

export function getBossTuningForWave(waveNumber) {
  if (!isBossWave(waveNumber)) return null;

  const profile = getBossProfileForWave(waveNumber);
  const bossIndex = normalizeBossIndex(profile?.bossIndex);
  const summonPlan = getBossSummonAddsPlan(waveNumber);

  const maxHp = Math.round(
    BOSS_TUNING.baseHp * Math.pow(1 + BOSS_TUNING.hpGrowthPerBoss, bossIndex - 1)
  );

  const moveSpeed = Math.min(
    BOSS_TUNING.maxMoveSpeed,
    Number((BOSS_TUNING.baseMoveSpeed + (bossIndex - 1) * BOSS_TUNING.moveSpeedGrowthPerBoss).toFixed(2))
  );

  const bastionDamage =
    BOSS_TUNING.baseBastionDamage +
    Math.floor((bossIndex - 1) / 2) * BOSS_TUNING.damageGrowthEveryTwoBosses;

  const tags = BOSS_TAG_ROTATION[(bossIndex - 1) % BOSS_TAG_ROTATION.length];

  return Object.freeze({
    waveNumber: Math.max(1, Math.floor(Number(waveNumber) || 1)),
    bossIndex,
    profileId: profile.profileId,
    name: profile.name,
    maxHp,
    armor: getBossArmorForIndex(bossIndex),
    moveSpeed,
    bastionDamage,
    goldReward: BOSS_TUNING.baseGoldReward + (bossIndex - 1) * BOSS_TUNING.goldRewardPerBoss,
    summonedAdds: summonPlan.totalAdds,
    faction: tags.faction,
    unitType: tags.unitType
  });
}

export function getBossTuningFixtures() {
  const wave10 = getBossTuningForWave(10);
  const wave20 = getBossTuningForWave(20);
  const wave30 = getBossTuningForWave(30);

  return Object.freeze({
    nonBossNull: getBossTuningForWave(9) === null,
    wave10HpExpected: 2200,
    wave10HpActual: wave10?.maxHp ?? null,
    hpScalesUp: (wave20?.maxHp ?? 0) > (wave10?.maxHp ?? 0) && (wave30?.maxHp ?? 0) > (wave20?.maxHp ?? 0),
    armorScalesUp: (wave30?.armor ?? 0) > (wave10?.armor ?? 0),
    moveSpeedCapped: (wave30?.moveSpeed ?? 0) <= BOSS_TUNING.maxMoveSpeed,
    rewardScalesUp: (wave30?.goldReward ?? 0) > (wave10?.goldReward ?? 0),
    summonsIncluded: (wave10?.summonedAdds ?? 0) > 0,
    bossTagsPresent: [wave10, wave20, wave30].every((boss) => Boolean(boss?.faction) && Boolean(boss?.unitType))
  });
}
