import { TOWER_COUNTER_TYPES, TOWER_FACTIONS } from '../towers/towerRoster.js';

export const FACTION_COUNTER_ENGINE = Object.freeze({
  version: 1,
  favorableMultiplier: 1.5,
  unfavorableMultiplier: 0.75,
  neutralMultiplier: 1,
  sameFactionMultiplier: 1,
  typeCorrectMultiplier: 1.5,
  typeWrongMultiplier: 0.75
});

const favorableAgainst = Object.freeze({
  [TOWER_FACTIONS.HUMAN]: TOWER_FACTIONS.INSECT,
  [TOWER_FACTIONS.INSECT]: TOWER_FACTIONS.ALIEN,
  [TOWER_FACTIONS.ALIEN]: TOWER_FACTIONS.HUMAN
});

export function getFactionMultiplier(attackerFaction, targetFaction) {
  if (attackerFaction === TOWER_FACTIONS.NEUTRAL) return FACTION_COUNTER_ENGINE.neutralMultiplier;
  if (!attackerFaction || !targetFaction) return FACTION_COUNTER_ENGINE.sameFactionMultiplier;
  if (attackerFaction === targetFaction) return FACTION_COUNTER_ENGINE.sameFactionMultiplier;
  if (favorableAgainst[attackerFaction] === targetFaction) return FACTION_COUNTER_ENGINE.favorableMultiplier;
  if (favorableAgainst[targetFaction] === attackerFaction) return FACTION_COUNTER_ENGINE.unfavorableMultiplier;
  return FACTION_COUNTER_ENGINE.sameFactionMultiplier;
}

export function getTypeMultiplier(counterType, targetUnitType) {
  if (counterType === TOWER_COUNTER_TYPES.SUPPORT) return 1;
  if (!counterType || !targetUnitType) return 1;
  return counterType === targetUnitType
    ? FACTION_COUNTER_ENGINE.typeCorrectMultiplier
    : FACTION_COUNTER_ENGINE.typeWrongMultiplier;
}

export function getCombinedCounterMultiplier(tower, enemy) {
  return Number((
    getFactionMultiplier(tower?.faction, enemy?.faction) *
    getTypeMultiplier(tower?.counterType, enemy?.unitType)
  ).toFixed(4));
}

export function getFactionCounterFixtures() {
  const perfect = getCombinedCounterMultiplier(
    { faction: TOWER_FACTIONS.HUMAN, counterType: TOWER_COUNTER_TYPES.AIR },
    { faction: TOWER_FACTIONS.INSECT, unitType: TOWER_COUNTER_TYPES.AIR }
  );
  const fullyBad = getCombinedCounterMultiplier(
    { faction: TOWER_FACTIONS.HUMAN, counterType: TOWER_COUNTER_TYPES.AIR },
    { faction: TOWER_FACTIONS.ALIEN, unitType: TOWER_COUNTER_TYPES.INFANTRY }
  );

  return Object.freeze({
    humanVsInsectExpected: 1.5,
    humanVsInsectActual: getFactionMultiplier(TOWER_FACTIONS.HUMAN, TOWER_FACTIONS.INSECT),
    insectVsAlienExpected: 1.5,
    insectVsAlienActual: getFactionMultiplier(TOWER_FACTIONS.INSECT, TOWER_FACTIONS.ALIEN),
    alienVsHumanExpected: 1.5,
    alienVsHumanActual: getFactionMultiplier(TOWER_FACTIONS.ALIEN, TOWER_FACTIONS.HUMAN),
    sameFactionExpected: 1,
    sameFactionActual: getFactionMultiplier(TOWER_FACTIONS.HUMAN, TOWER_FACTIONS.HUMAN),
    neutralExpected: 1,
    neutralActual: getFactionMultiplier(TOWER_FACTIONS.NEUTRAL, TOWER_FACTIONS.ALIEN),
    correctTypeExpected: 1.5,
    correctTypeActual: getTypeMultiplier(TOWER_COUNTER_TYPES.ARMORED, TOWER_COUNTER_TYPES.ARMORED),
    wrongTypeExpected: 0.75,
    wrongTypeActual: getTypeMultiplier(TOWER_COUNTER_TYPES.ARMORED, TOWER_COUNTER_TYPES.AIR),
    perfectExpected: 2.25,
    perfectActual: perfect,
    fullyBadExpected: 0.5625,
    fullyBadActual: fullyBad
  });
}
