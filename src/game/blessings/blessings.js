export const BLESSING_RARITIES = Object.freeze({
  COMMON: 'common',
  RARE: 'rare',
  EPIC: 'epic'
});

export const BLESSING_CATEGORIES = Object.freeze({
  OFFENSE: 'offense',
  DEFENSE: 'defense',
  ECONOMY: 'economy',
  CONTROL: 'control'
});

export const BLESSINGS = Object.freeze([
  Object.freeze({
    id: 'keen-edge',
    name: 'Keen Edge',
    description: 'All towers deal 8% more damage.',
    rarity: BLESSING_RARITIES.COMMON,
    category: BLESSING_CATEGORIES.OFFENSE,
    tags: Object.freeze(['tower-damage']),
    maxStacks: 3,
    effect: Object.freeze({ towerDamageMultiplier: 1.08 })
  }),
  Object.freeze({
    id: 'iron-bastion',
    name: 'Iron Bastion',
    description: 'The Bastion takes 8% less damage.',
    rarity: BLESSING_RARITIES.COMMON,
    category: BLESSING_CATEGORIES.DEFENSE,
    tags: Object.freeze(['bastion']),
    maxStacks: 3,
    effect: Object.freeze({ bastionDamageTakenMultiplier: 0.92 })
  }),
  Object.freeze({
    id: 'war-chest',
    name: 'War Chest',
    description: 'Gain +2 bonus gold after every cleared wave.',
    rarity: BLESSING_RARITIES.COMMON,
    category: BLESSING_CATEGORIES.ECONOMY,
    tags: Object.freeze(['gold']),
    maxStacks: 2,
    effect: Object.freeze({ waveClearGoldBonus: 2 })
  }),
  Object.freeze({
    id: 'rapid-volley',
    name: 'Rapid Volley',
    description: 'All towers attack 7% faster.',
    rarity: BLESSING_RARITIES.COMMON,
    category: BLESSING_CATEGORIES.OFFENSE,
    tags: Object.freeze(['attack-speed']),
    maxStacks: 3,
    effect: Object.freeze({ attackSpeedMultiplier: 1.07 })
  }),
  Object.freeze({
    id: 'frostbound',
    name: 'Frostbound',
    description: 'Slow effects gain 12% additional strength.',
    rarity: BLESSING_RARITIES.RARE,
    category: BLESSING_CATEGORIES.CONTROL,
    tags: Object.freeze(['slow']),
    maxStacks: 2,
    effect: Object.freeze({ slowStrengthBonus: 0.12 })
  }),
  Object.freeze({
    id: 'siegebreaker',
    name: 'Siegebreaker',
    description: 'Deal 18% more damage to bosses.',
    rarity: BLESSING_RARITIES.RARE,
    category: BLESSING_CATEGORIES.OFFENSE,
    tags: Object.freeze(['boss']),
    maxStacks: 2,
    effect: Object.freeze({ bossDamageMultiplier: 1.18 })
  }),
  Object.freeze({
    id: 'prosperity',
    name: 'Prosperity',
    description: 'Wave-clear gold rewards are increased by 15%.',
    rarity: BLESSING_RARITIES.RARE,
    category: BLESSING_CATEGORIES.ECONOMY,
    tags: Object.freeze(['gold']),
    maxStacks: 2,
    effect: Object.freeze({ waveClearGoldMultiplier: 1.15 })
  }),
  Object.freeze({
    id: 'unyielding-core',
    name: 'Unyielding Core',
    description: 'Increase maximum Bastion HP by 4.',
    rarity: BLESSING_RARITIES.RARE,
    category: BLESSING_CATEGORIES.DEFENSE,
    tags: Object.freeze(['bastion', 'max-hp']),
    maxStacks: 2,
    effect: Object.freeze({ bastionMaxHpBonus: 4 })
  }),
  Object.freeze({
    id: 'last-light',
    name: 'Last Light',
    description: 'Below 35% Bastion HP, incoming damage is reduced by 25%.',
    rarity: BLESSING_RARITIES.EPIC,
    category: BLESSING_CATEGORIES.DEFENSE,
    tags: Object.freeze(['bastion', 'emergency']),
    maxStacks: 1,
    effect: Object.freeze({ lowHpDamageReductionMultiplier: 0.75, triggerHpRatio: 0.35 })
  }),
  Object.freeze({
    id: 'golden-tempest',
    name: 'Golden Tempest',
    description: 'Gain 20% tower damage, but wave-clear gold is reduced by 20%.',
    rarity: BLESSING_RARITIES.EPIC,
    category: BLESSING_CATEGORIES.OFFENSE,
    tags: Object.freeze(['tower-damage', 'gold', 'tradeoff']),
    maxStacks: 1,
    effect: Object.freeze({ towerDamageMultiplier: 1.2, waveClearGoldMultiplier: 0.8 })
  }),
  Object.freeze({
    id: 'time-lock',
    name: 'Time Lock',
    description: 'Enemies move 10% slower.',
    rarity: BLESSING_RARITIES.EPIC,
    category: BLESSING_CATEGORIES.CONTROL,
    tags: Object.freeze(['enemy-speed']),
    maxStacks: 1,
    effect: Object.freeze({ enemyMoveSpeedMultiplier: 0.9 })
  })
]);

export const BLESSING_SYSTEM = Object.freeze({
  version: 2,
  choiceCount: 3,
  offerEveryBossClear: true,
  rarities: BLESSING_RARITIES,
  categories: BLESSING_CATEGORIES
});

function normalizeSeed(seed) {
  const value = String(seed ?? 'blessing-seed');
  let hash = 2166136261;
  for (let i = 0; i < value.length; i += 1) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function seededIndex(seed, modulo) {
  if (modulo <= 0) return 0;
  return normalizeSeed(seed) % modulo;
}

export function getBlessingById(blessingId) {
  return BLESSINGS.find((entry) => entry.id === blessingId) ?? null;
}

export function getEligibleBlessings(ownedBlessings = []) {
  const stackCountById = ownedBlessings.reduce((acc, blessingId) => {
    acc[blessingId] = (acc[blessingId] ?? 0) + 1;
    return acc;
  }, {});

  return BLESSINGS.filter((blessing) => (stackCountById[blessing.id] ?? 0) < blessing.maxStacks);
}

export function getBlessingOffer(seed, ownedBlessings = [], choiceCount = BLESSING_SYSTEM.choiceCount) {
  const eligible = [...getEligibleBlessings(ownedBlessings)];
  const count = Math.max(1, Math.min(Math.floor(Number(choiceCount) || 1), eligible.length));
  const selected = [];

  for (let pick = 0; pick < count; pick += 1) {
    const index = seededIndex(`${seed}:${pick}:${eligible.length}`, eligible.length);
    selected.push(eligible.splice(index, 1)[0]);
  }

  return Object.freeze(selected.map((entry) => Object.freeze(entry)));
}

export function addBlessingToLoadout(ownedBlessings = [], blessingId) {
  const blessing = getBlessingById(blessingId);
  if (!blessing) return Object.freeze([...ownedBlessings]);

  const currentStacks = ownedBlessings.filter((id) => id === blessingId).length;
  if (currentStacks >= blessing.maxStacks) return Object.freeze([...ownedBlessings]);

  return Object.freeze([...ownedBlessings, blessingId]);
}

export function getBlessingSystemFixtures() {
  const offerA = getBlessingOffer('run-123', [], 3);
  const offerB = getBlessingOffer('run-123', [], 3);
  const capped = addBlessingToLoadout(['last-light'], 'last-light');
  const stacked = addBlessingToLoadout(['keen-edge'], 'keen-edge');

  return Object.freeze({
    choiceCountExpected: 3,
    choiceCountActual: offerA.length,
    deterministicOffer:
      offerA.map((entry) => entry.id).join('|') === offerB.map((entry) => entry.id).join('|'),
    uniqueChoices: new Set(offerA.map((entry) => entry.id)).size === offerA.length,
    validDefinitions: BLESSINGS.every((entry) =>
      Boolean(entry.id) &&
      Boolean(entry.name) &&
      Boolean(entry.description) &&
      Object.values(BLESSING_RARITIES).includes(entry.rarity) &&
      Object.values(BLESSING_CATEGORIES).includes(entry.category) &&
      entry.maxStacks >= 1 &&
      Object.keys(entry.effect).length >= 1
    ),
    setSizeExpected: 11,
    setSizeActual: BLESSINGS.length,
    categoryCoverage: Object.values(BLESSING_CATEGORIES).every((category) =>
      BLESSINGS.some((entry) => entry.category === category)
    ),
    rarityCoverage: Object.values(BLESSING_RARITIES).every((rarity) =>
      BLESSINGS.some((entry) => entry.rarity === rarity)
    ),
    hasTradeoffBlessing: BLESSINGS.some((entry) => entry.tags.includes('tradeoff')),
    maxStackRespected: capped.length === 1,
    stackAddedWhenAllowed: stacked.length === 2
  });
}
