# Bastionfall — Definitive Enemy Roster & Wave Director Spec

Locked after BATCH 105/120.

This document defines the required work for BATCH 106/120 and BATCH 107/120 and the compatibility contract for BATCH 108–120.

## Current-state contract

Use the refreshed current `main` branch as source of truth.

Do not redo BATCH 1–105.

The project now uses the current 24-tower roster. Preserve it.

Do not:
- revert to an older small tower set
- remove current towers
- merge current towers arbitrarily
- break tower faction identity
- break unit-type specialization
- break placement, upgrades, evolutions or TFT/shop flows
- duplicate working wave/spawn systems

The new enemy/wave work must make the current 24 towers more meaningful, not obsolete them.

## Counter system

Preserve the existing faction/type counter system.

Faction cycle:
- Human > Insect
- Insect > Alien
- Alien > Human

Correct faction counter: x1.5 damage.

Unit types:
- Infantry
- Armored
- Air

Correct unit-type specialization: x1.5 damage.

When both counters apply:
- x1.5 faction
- x1.5 unit type
- final intended multiplier: x2.25

Do not flatten or replace this double-counter interaction.

## BATCH 106/120 — Definitive 24-Enemy Roster & Data Model

There are exactly 24 enemy units:
- 8 Human
- 8 Insect
- 8 Alien

Every enemy definition must be data-driven and contain at least:
- id
- name
- faction
- unitType
- tier
- spawnCost
- minWave
- traits
- base stats
- visual asset mapping

Valid tiers:
- Common
- Advanced
- Elite
- Boss

### Human — 8

1. `footman` — Footman — Infantry — balanced basic soldier
2. `ranger` — Ranger — Infantry — fast, low HP
3. `vanguard` — Vanguard — Infantry — starts with a small shield
4. `ironclad` — Ironclad — Armored — very high armor, slow
5. `siegebreaker` — Siegebreaker — Armored — very high HP, strong Bastion threat
6. `bastion-ram` — Bastion Ram — Armored — heavy reinforced assault unit
7. `skyguard` — Skyguard — Air — standard Human flying unit
8. `gryphon-knight` — Gryphon Knight — Air — fast and durable aerial elite

Human visual identity:
- royal blue
- steel/silver
- gold

### Insect — 8

9. `skitterling` — Skitterling — Infantry — very fast swarm unit
10. `ravager` — Ravager — Infantry — becomes faster when wounded
11. `broodling` — Broodling — Infantry — split/spawn behavior on death where supported
12. `carapace-beast` — Carapace Beast — Armored — thick natural armor
13. `burrower` — Burrower — Armored — burrow/emergence behavior
14. `hive-guard` — Hive Guard — Armored — defensive heavy insect
15. `stinger` — Stinger — Air — fast lightweight aerial unit
16. `broodwing` — Broodwing — Air — larger aerial insect associated with brood pressure

Insect visual identity:
- toxic green
- acid yellow
- amber
- dark brown/black chitin

### Alien — 8

17. `voidling` — Voidling — Infantry — standard Alien unit
18. `phasewalker` — Phasewalker — Infantry — short phase/dash movement
19. `assimilator` — Assimilator — Infantry — adaptive resistance behavior
20. `null-guardian` — Null Guardian — Armored — strong energy shield
21. `obliterator` — Obliterator — Armored — massive slow siege unit
22. `rift-juggernaut` — Rift Juggernaut — Armored — heavy crystalline void armor
23. `watcher` — Watcher — Air — hovering Alien scout/combat unit
24. `overmind` — Overmind — Air — high-tier hovering Alien commander

Alien visual identity:
- violet/purple
- magenta
- cyan/teal energy
- dark obsidian

### BATCH 106 integration rules

Use the attached 24-enemy artwork as visual source when available.

Map the artwork to the roster above and preserve faction readability.

Integrate with the existing enemy base model instead of creating a parallel enemy implementation.

Do not rewrite the current tower roster.

All 24 current towers must remain functional against the new roster.

### BATCH 106 verification

Verify:
- exactly 24 enemy definitions
- exactly 8 Human
- exactly 8 Insect
- exactly 8 Alien
- Infantry/Armored/Air metadata is valid
- all 24 definitions can spawn through existing systems
- faction counter still works
- unit-type counter still works
- double counter resolves to x2.25
- no regression to any of the current 24 towers
- no regression to placement/upgrades/evolutions/TFT

## BATCH 107/120 — Deterministic Wave Director Integration

Do not create a second wave engine.

The Wave Director is the deterministic composition layer feeding the existing:
- wave phase state machine
- preparation phase
- spawn queue
- wave completion detection
- infinite scaling
- wave preview
- enemy threat-budget foundation
- boss schedule
- Elite modifiers
- World modifiers
- Tri-Gate spawn distribution

Reuse those systems wherever they already work.

### Enemy spawn cost

Each enemy receives a `spawnCost`.

General budget philosophy:
- weak swarm: about 1
- normal: about 2
- stronger specialist: about 3
- heavy armored: about 4–6
- Elite: about 8–12
- Boss: scheduled/dedicated boss budget

Tune exact values against the current repository balance.

### Wave budget

Each normal wave receives a threat/spawn budget.

The director spends that budget on legal enemy compositions.

Difficulty should grow mainly through:
- enemy count
- composition
- faction combinations
- unit-type combinations
- Advanced units
- Elite pressure
- Boss pressure
- World Modifiers
- moderate stat scaling

Avoid absurd raw HP inflation as the primary difficulty mechanism.

### Progression

Waves 1–4:
- simple compositions
- mostly Infantry
- primarily one faction per wave
- teach faction/type readability

Wave 5:
- first Elite milestone

Waves 6–9:
- introduce Armored units
- begin counter-pressure

Wave 10:
- first Boss milestone

Waves 11–14:
- Infantry + Armored combinations
- stronger composition diversity

Wave 15:
- Elite milestone
- meaningful Air introduction

Waves 16–19:
- complete faction compositions
- Infantry/Armored/Air all relevant

Wave 20:
- stronger Boss milestone

Waves 21–30:
- controlled mixed-faction waves
- increased composition complexity

Wave 31+:
- all factions available
- all unit types available
- Advanced/Elite combinations
- increasingly hostile compositions
- World Modifiers increasingly relevant
- endless generation remains valid

### Milestones

Every 5th wave is an Elite milestone.

Every 10th wave is a Boss milestone.

Integrate with the existing boss schedule. Do not duplicate bosses just because the director sees a multiple of 10.

### Composition rules

Early waves may be deliberately simple.

Later waves must not be solved by one specialization alone.

Example later mix:
- 60% Insect Air
- 25% Insect Armored
- 15% Alien Infantry

The goal is to reward varied use of the current 24-tower roster.

Avoid:
- impossible early Air pressure
- excessive simultaneous heavy enemies
- unfair RNG spikes
- unavoidable burst combinations
- compositions with no reasonable counter
- waves that make most of the 24 towers irrelevant

### Single Gate

Use one main path with the normal director output.

### Tri-Gate

Do not triple overall difficulty.

Generate one total wave budget and distribute it intelligently across the three entrances.

Preserve current Tri-Gate economy and pacing.

### Determinism contract

Wave generation must support:

`seed + waveNumber + mode`

Same seed + same wave + same mode must produce the same:
- enemy identities
- quantities
- lane distribution where relevant
- Elite selections
- relevant randomized wave decisions

This deterministic output is the contract consumed by BATCH 108.

### BATCH 107 verification

Verify:
- identical seed generates identical legal waves
- different seeds can generate different legal waves
- threat budget is respected
- Elite milestones work
- Boss milestones integrate with existing schedule
- Air introduction occurs at intended progression
- mixed factions appear only when intended
- endless generation continues safely
- Single Gate works
- Tri-Gate works
- wave preview still works
- wave completion still works
- economy still works
- all current 24 towers still work
- tower placement/upgrades/evolutions still work
- TFT/shop mode still works

## BATCH 108/120 compatibility contract

BATCH 108 — Shared Seed & Synchronized Wave Start must consume the deterministic Wave Director from BATCH 107.

All participants in one Last Bastion match must receive equivalent:
- seed
- wave composition
- enemy counts
- boss schedule
- relevant modifiers
- spawn timing

Do not create a parallel Last Bastion-only generator.

## BATCH 116/120 required tower telemetry

BATCH 116 must explicitly inspect the current 24 towers.

Include:
- per-tower usage
- per-tower DPS contribution
- faction-counter coverage
- unit-type-counter coverage
- underused towers
- overperforming towers
- late-run tower diversity
- long-run performance/memory impact

## BATCH 118/120 required regression coverage

Explicitly verify:
- all current 24 towers function
- all current 24 enemies function
- faction counters function
- unit-type counters function
- x2.25 double counter functions
- placement functions
- upgrade flows function
- evolution flows function
- TFT/shop flows function
- enemy/tower interactions remain stable
- Wave Director does not invalidate most of the tower roster
- Single Gate, Tri-Gate and Last Bastion use compatible wave semantics

## Mini-batch execution rule

Every user message saying `next` means execute exactly ONE batch.

At the start:
`BATCH X/120 — <name>`

When complete and tested:
`✅ BATCH X/120 COMPLETE`

Then only:
- Changed:
- Tested:
- Problems:
- Next:

Then STOP.
