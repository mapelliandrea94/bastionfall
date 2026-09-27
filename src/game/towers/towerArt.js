import { TOWER_EVOLUTIONS } from './evolutions.js';

export const TOWER_ART_SYSTEM = Object.freeze({
  version: 1,
  sheetPath: '/assets/towers/bastionfall-towers-24.webp',
  expectedEvolutionCount: 24,
  frameColumns: 6,
  frameRows: 4
});

const factionPalette = Object.freeze({
  human: Object.freeze({ primary: '#2d6fb8', secondary: '#d9b85c', accent: '#dce8f1' }),
  insect: Object.freeze({ primary: '#6b3aa6', secondary: '#75b94b', accent: '#d7e990' }),
  alien: Object.freeze({ primary: '#23272e', secondary: '#35d4df', accent: '#91f6ff' }),
  neutral: Object.freeze({ primary: '#c9c5b8', secondary: '#d18b42', accent: '#9b6b3e' })
});

const frameByEvolutionId = Object.freeze(
  Object.fromEntries(TOWER_EVOLUTIONS.map((evolution, index) => [
    evolution.id,
    Object.freeze({
      index,
      column: index % TOWER_ART_SYSTEM.frameColumns,
      row: Math.floor(index / TOWER_ART_SYSTEM.frameColumns)
    })
  ]))
);

export function getTowerArtFrame(evolutionId) {
  return frameByEvolutionId[evolutionId] ?? null;
}

export function getTowerArtPalette(faction) {
  return factionPalette[faction] ?? factionPalette.neutral;
}

export function getRepresentativeEvolutionId(towerId, branch = 'A') {
  return TOWER_EVOLUTIONS.find((entry) => entry.towerId === towerId && entry.branch === branch)?.id ?? null;
}

export function getTowerArtStyleForTower(towerId, evolutionId = null) {
  return getTowerArtStyle(evolutionId ?? getRepresentativeEvolutionId(towerId, 'A'));
}

export function getTowerArtStyle(evolutionId) {
  const frame = getTowerArtFrame(evolutionId);
  if (!frame) return Object.freeze({});

  const x = TOWER_ART_SYSTEM.frameColumns <= 1
    ? 0
    : frame.column / (TOWER_ART_SYSTEM.frameColumns - 1) * 100;
  const y = TOWER_ART_SYSTEM.frameRows <= 1
    ? 0
    : frame.row / (TOWER_ART_SYSTEM.frameRows - 1) * 100;

  return Object.freeze({
    backgroundImage: `url("${TOWER_ART_SYSTEM.sheetPath}")`,
    backgroundSize: `${TOWER_ART_SYSTEM.frameColumns * 100}% ${TOWER_ART_SYSTEM.frameRows * 100}%`,
    backgroundPosition: `${x}% ${y}%`
  });
}

export function getTowerArtFixtures() {
  const frames = TOWER_EVOLUTIONS.map((entry) => getTowerArtFrame(entry.id));

  return Object.freeze({
    expectedEvolutionCount: 24,
    actualEvolutionCount: TOWER_EVOLUTIONS.length,
    everyEvolutionMapped: frames.every(Boolean),
    uniqueFrames: new Set(frames.map((frame) => frame.index)).size === 24,
    humanPaletteDistinct: getTowerArtPalette('human').primary !== getTowerArtPalette('alien').primary,
    alienNeutralDistinct: getTowerArtPalette('alien').secondary !== getTowerArtPalette('neutral').secondary,
    everyBaseTowerHasRepresentativeArt: new Set(TOWER_EVOLUTIONS.map((entry) => entry.towerId)).size === 12
  });
}
