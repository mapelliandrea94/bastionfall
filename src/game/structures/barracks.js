export const BARRACKS = Object.freeze({
  id: 'barracks',
  name: 'Barracks',
  role: 'lane-control',
  cost: 130,
  squadSize: 3,
  respawnIntervalMs: 6500,
  engageRadius: 150,
  rallyRange: 220,
  unitDamage: 10,
  unitAttackIntervalMs: 1000,
  unitHp: 85,
  damageType: 'physical',
  description: 'Deploys a small melee squad to stall enemies and control the lane.'
});

export function getBarracksDefinition() {
  return BARRACKS;
}
