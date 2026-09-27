import { TOWER_ROSTER, TOWER_FACTIONS } from '../towers/towerRoster.js';

export const TFT_SHOP = Object.freeze({
  version: 1,
  slotCount: 7,
  copyCost: 2,
  rerollCost: 3,
  startingGold: 10,
  waveClearGold: 5,
  composition: Object.freeze({
    [TOWER_FACTIONS.HUMAN]: 2,
    [TOWER_FACTIONS.INSECT]: 2,
    [TOWER_FACTIONS.ALIEN]: 2,
    [TOWER_FACTIONS.NEUTRAL]: 1
  })
});

function hashSeed(seed) {
  const value = String(seed ?? 'tft-shop');
  let hash = 2166136261;
  for (let i = 0; i < value.length; i += 1) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function pickFactionOffers(faction, count, seed) {
  const pool = TOWER_ROSTER.towers.filter((tower) => tower.faction === faction);
  return Array.from({ length: count }, (_, index) => {
    const pickIndex = hashSeed(`${seed}:${faction}:${index}`) % pool.length;
    const tower = pool[pickIndex];
    return Object.freeze({
      slotId: `${faction}-${index + 1}`,
      towerId: tower.id,
      name: tower.name,
      faction: tower.faction,
      role: tower.role,
      cost: TFT_SHOP.copyCost
    });
  });
}

export function createTftShopOffers(seed, rollIndex = 0) {
  const rollSeed = `${seed}:roll:${Math.max(0, Number(rollIndex) || 0)}`;
  return Object.freeze([
    ...pickFactionOffers(TOWER_FACTIONS.HUMAN, 2, rollSeed),
    ...pickFactionOffers(TOWER_FACTIONS.INSECT, 2, rollSeed),
    ...pickFactionOffers(TOWER_FACTIONS.ALIEN, 2, rollSeed),
    ...pickFactionOffers(TOWER_FACTIONS.NEUTRAL, 1, rollSeed)
  ]);
}

export function getTftShopFixtures() {
  const offers = createTftShopOffers('fixture', 0);
  const rerolled = createTftShopOffers('fixture', 1);
  const count = (faction) => offers.filter((offer) => offer.faction === faction).length;

  return Object.freeze({
    slotCountExpected: 7,
    slotCountActual: offers.length,
    humanExpected: 2,
    humanActual: count(TOWER_FACTIONS.HUMAN),
    insectExpected: 2,
    insectActual: count(TOWER_FACTIONS.INSECT),
    alienExpected: 2,
    alienActual: count(TOWER_FACTIONS.ALIEN),
    neutralExpected: 1,
    neutralActual: count(TOWER_FACTIONS.NEUTRAL),
    everyCopyCostsTwo: offers.every((offer) => offer.cost === 2),
    rerollCostExpected: 3,
    rerollCostActual: TFT_SHOP.rerollCost,
    startingGoldExpected: 10,
    startingGoldActual: TFT_SHOP.startingGold,
    waveClearGoldExpected: 5,
    waveClearGoldActual: TFT_SHOP.waveClearGold,
    deterministic: JSON.stringify(offers) === JSON.stringify(createTftShopOffers('fixture', 0)),
    rerollChangesSeededOffer: JSON.stringify(offers) !== JSON.stringify(rerolled)
  });
}
