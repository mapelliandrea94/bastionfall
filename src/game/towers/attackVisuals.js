// Visuals follow the tower's actual attack role and selected evolution.
export function getTowerAttackVisual(definition, evolution) {
  switch (evolution) {
    case 'flak-bastion': return 'flak';
    case 'siegeburst-mortar':
    case 'barrage-howitzer': return 'shell';
    case 'reaper-turret': return 'bullet';
    case 'skyswarm-hive':
    case 'brood-swarm-nest': return 'swarm';
    case 'burrow-mauler-pod': return 'spike';
    case 'plague-bloom': return 'venom';
    case 'prism-beam-array':
    case 'singularity-lance':
    case 'phase-breaker-core': return 'beam';
    case 'mindpulse-obelisk':
    case 'gravity-well-projector': return 'pulse';
    case 'command-relay':
    case 'overclock-shrine': return 'aura';
    default: break;
  }

  switch (definition.id) {
    case 'human-aa': return 'arrow';
    case 'human-armor': return 'shell';
    case 'human-infantry': return 'bullet';
    case 'insect-aa': return 'venom';
    case 'insect-armor': return 'acid';
    case 'insect-infantry': return 'swarm';
    case 'alien-aa': return 'chain';
    case 'alien-armor': return 'beam';
    case 'alien-infantry': return 'plasma';
    case 'slow': return 'frost';
    case 'debuff': return 'mark';
    case 'buff': return 'aura';
    default: return 'bullet';
  }
}
