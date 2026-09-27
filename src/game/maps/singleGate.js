export const SINGLE_GATE_MAP = Object.freeze({
  id: 'single-gate-first-bastion',
  version: 1,
  mode: 'single-gate',
  name: 'First Bastion',
  size: Object.freeze({
    width: 1600,
    height: 900
  }),
  anchors: Object.freeze({
    enemySpawn: Object.freeze({
      id: 'enemy-spawn',
      x: 80,
      y: 450
    }),
    bastion: Object.freeze({
      id: 'bastion-core',
      x: 1460,
      y: 450
    })
  }),
  camera: Object.freeze({
    centerX: 800,
    centerY: 450,
    minZoom: 0.7,
    maxZoom: 1.25
  }),
  tags: Object.freeze([
    'single-front',
    'endless-survival',
    'first-bastion'
  ])
});

export function getSingleGateMapModel() {
  return SINGLE_GATE_MAP;
}
