import { NORMAL_MODE_TOWERS_BY_ID } from '../towers/normalBuildRoster.js';
import { getRuntimeTowerDefinition } from '../towers/evolutions.js';
import { applyTowerSynergy, getTowerSynergyState } from '../towers/towerSynergies.js';
import { getTowerComboDamageMultiplier } from '../towers/towerCombos.js';
import { getEffectiveTowerAttackInterval, getTowerHitDamage, getTowerTargets } from '../combat/baseTowerCombat.js';
import { applyStrongestArmorShred, applyStrongestTimedEffect } from '../combat/supportStacking.js';
import { applyBlessingBastionDamage, applyBlessingTowerIdentity, applyBlessingWaveGold, getBlessingAdjustedMaxHp, getBlessingModifiers } from '../blessings/blessingEngine.js';
import { applyEnemyDamage, getEnemyEffectiveSpeed } from '../enemies/enemyBase.js';
import { createRosterEnemyState } from '../enemies/enemyRoster.js';
import { createNormalEnemyState } from '../enemies/normal.js';
import { createRunnerEnemyState } from '../enemies/runner.js';
import { createShieldedEnemyState } from '../enemies/shielded.js';
import { applyEliteModifiers, attachEliteModifierFoundation } from '../elites/eliteModifiers.js';
import { SINGLE_GATE_MAP } from '../maps/singleGate.js';
import { TRI_GATE_MAP } from '../maps/triGate.js';
import { generateWavePlan } from '../spawning/waveDirector.js';
import { distributeTriGateWave, flattenTriGateDistribution } from '../spawning/triGateSpawn.js';
import { getBandWaveScaling } from '../balance/difficultyBands.js';
import { TRI_GATE_PACING, getTriGateWaveClearReward, getTriGateWaveScaling } from '../balance/triGatePacing.js';
import { SUDDEN_SIEGE, applySuddenSiegeEnemyScaling, getSuddenSiegeWaveReward, getSuddenSiegeWaveScaling } from '../balance/suddenSiege.js';
import { TFT_SHOP } from '../tft/tftShop.js';
import { ECONOMY_BASELINE, getEnemyKillReward, getWaveClearReward } from '../economy/economyBaseline.js';
import { applyRiskRewardGold, getRiskRewardConfig } from '../balance/riskReward.js';
import { getActiveWorldModifiers, getWorldModifierEffects } from '../world/worldModifiers.js';
import { applyWaveAffix, getWaveAffix } from '../waves/waveAffixes.js';
import { applyRareWaveEvent, getRareWaveEvent } from '../waves/rareWaveEvents.js';
import { evaluateMiniObjective, getMiniObjectiveForWave, getMiniObjectiveReward } from '../objectives/miniObjectives.js';
import { getEndlessMilestone } from './endlessMilestones.js';
import { createRunEndSnapshot } from './runEndSnapshot.js';
import { isBossWave } from '../boss/bossSchedule.js';
import { getBossSummonAddsPlan } from '../boss/bossSummonAdds.js';
import { WALL_PROGRESS_BY_ID, WALL_SYSTEM } from '../structures/walls.js';

const SUPPORTED_MODES = new Set(['single-gate', 'tri-gate', 'tft-shop', 'sudden-siege']);
const MAX_SIMULATION_STEPS = 1800;
const MAX_OFFLINE_MS = 6 * 60 * 60 * 1000;
const BASE_CORE_HP = 20;

function isShopMode(mode) {
  return mode === 'tft-shop' || mode === 'sudden-siege';
}

function getScaling(wave, mode) {
  if (mode === 'tri-gate') return getTriGateWaveScaling(wave);
  if (mode === 'sudden-siege') return getSuddenSiegeWaveScaling(wave);
  return getBandWaveScaling(wave);
}

function getPreparationSeconds(mode, snapshot) {
  if (mode === 'tri-gate') return TRI_GATE_PACING.preparationSeconds;
  if (mode === 'sudden-siege') return snapshot?.tftAutoStartEnabled ? 20 : 40;
  if (mode === 'tft-shop') return snapshot?.tftAutoStartEnabled ? 20 : 40;
  return 15;
}

function getPathPosition(waypoints, progress) {
  if (!Array.isArray(waypoints) || waypoints.length === 0) return { x: 0, y: 0 };
  if (waypoints.length === 1) return waypoints[0];

  const segments = [];
  let totalLength = 0;
  for (let index = 0; index < waypoints.length - 1; index += 1) {
    const from = waypoints[index];
    const to = waypoints[index + 1];
    const length = Math.hypot(to.x - from.x, to.y - from.y);
    segments.push({ from, to, length });
    totalLength += length;
  }

  let remaining = Math.max(0, Math.min(1, Number(progress) || 0)) * totalLength;
  for (const segment of segments) {
    if (remaining <= segment.length) {
      const ratio = segment.length === 0 ? 0 : remaining / segment.length;
      return {
        x: segment.from.x + (segment.to.x - segment.from.x) * ratio,
        y: segment.from.y + (segment.to.y - segment.from.y) * ratio
      };
    }
    remaining -= segment.length;
  }
  return waypoints[waypoints.length - 1];
}

function getEnemyPath(mode, enemy) {
  if (mode !== 'tri-gate') return SINGLE_GATE_MAP.path.waypoints;
  return TRI_GATE_MAP.pathPlan.lanes.find((lane) => lane.id === enemy?.laneId)?.waypoints
    ?? TRI_GATE_MAP.pathPlan.lanes[0].waypoints;
}

function buildSlotsForMode(mode) {
  return mode === 'tri-gate'
    ? TRI_GATE_MAP.buildSlotPolicy.slots
    : SINGLE_GATE_MAP.buildSlots.slots;
}

function waveContext(snapshot) {
  const run = snapshot.run;
  const wave = Math.max(1, Number(run.wave ?? 0) + 1);
  const bossWave = isBossWave(wave);
  const world = getWorldModifierEffects(getActiveWorldModifiers(run.seed ?? 'run', wave));
  const risk = getRiskRewardConfig(run.mode, snapshot.riskRewardTier ?? 'safe');
  const rare = getRareWaveEvent(run.seed ?? 'run', wave, { bossWave });
  const affix = rare ? null : getWaveAffix(run.seed ?? 'run', wave, { bossWave });
  const scaling = getScaling(wave, run.mode);
  return { wave, bossWave, world, risk, rare, affix, scaling };
}

function buildWaveQueue(snapshot) {
  const { run } = snapshot;
  const ctx = waveContext(snapshot);
  const budgetMultiplier =
    (run.mode === 'tri-gate'
      ? TRI_GATE_PACING.threatMultiplier
      : run.mode === 'sudden-siege'
        ? Number(ctx.scaling.suddenThreatMultiplier ?? 1)
        : 1) *
    ctx.world.threatMultiplier *
    ctx.risk.threatMultiplier *
    Number(ctx.rare?.threatMultiplier ?? 1);

  const plan = generateWavePlan({
    seed: run.seed ?? 'run',
    waveNumber: ctx.wave,
    mode: run.mode,
    budgetMultiplier
  });

  const composition = run.mode === 'tri-gate'
    ? flattenTriGateDistribution(distributeTriGateWave(plan.composition, ctx.wave))
    : plan.composition;

  const deterministicSpawnIntervalMs = Math.max(
    1,
    Number(ctx.scaling.spawnIntervalMs ?? 900) *
      ctx.world.spawnIntervalMultiplier *
      Number(ctx.affix?.spawnIntervalMultiplier ?? 1) *
      Number(ctx.rare?.spawnIntervalMultiplier ?? 1) *
      0.5
  );

  return composition.map((enemy, index) => attachEliteModifierFoundation({
    ...enemy,
    id: `wave-${ctx.wave}-enemy-${index + 1}`,
    scheduledSpawnOffsetMs: 150 + index * deterministicSpawnIntervalMs
  }, {
    seed: run.seed ?? 'run',
    waveNumber: ctx.wave,
    enemyIndex: index
  }));
}

function createEnemyState(item, snapshot, virtualNow, spawnedAt = virtualNow) {
  let enemy = item?.rosterId
    ? createRosterEnemyState(item.rosterId, { ...item, progress: 0, spawnedAt, lastMovementAt: spawnedAt })
    : item?.archetype === 'runner'
      ? createRunnerEnemyState({ ...item, progress: 0, spawnedAt, lastMovementAt: spawnedAt })
      : item?.archetype === 'shielded'
        ? createShieldedEnemyState({ ...item, progress: 0, spawnedAt, lastMovementAt: spawnedAt })
        : createNormalEnemyState({ ...item, progress: 0, spawnedAt, lastMovementAt: spawnedAt });

  const ctx = waveContext(snapshot);
  if (snapshot.run.mode === 'sudden-siege') enemy = applySuddenSiegeEnemyScaling(enemy, ctx.wave);
  enemy = applyWaveAffix(enemy, ctx.affix);
  enemy = applyRareWaveEvent(enemy, ctx.rare);
  return applyEliteModifiers(enemy);
}

function normalizedTowers(snapshot) {
  const slots = buildSlotsForMode(snapshot.run.mode);
  return (snapshot.placedDefenses ?? []).map((tower) => {
    const slot = slots.find((entry) => entry.id === tower.slotId);
    return slot ? { ...tower, x: slot.x, y: slot.y } : { ...tower };
  });
}

function applyStatusTick(enemy, dtMs, virtualNow) {
  const status = { ...(enemy.statusEffects ?? {}) };
  let next = enemy;
  if (Number(status.poisonUntilMs ?? 0) > virtualNow && Number(status.poisonDamagePerSecond ?? 0) > 0) {
    next = applyEnemyDamage(next, Number(status.poisonDamagePerSecond) * (dtMs / 1000), 'physical');
  }
  if (Number(status.vulnerabilityUntilMs ?? 0) <= virtualNow) {
    status.vulnerabilityPercent = 0;
    status.vulnerabilityUntilMs = 0;
  }
  if (Number(status.armorShredUntilMs ?? 0) <= virtualNow && Number(status.armorShred ?? 0) > 0) {
    next = { ...next, armor: Number(next.armor ?? 0) + Number(status.armorShred) };
    status.armorShred = 0;
    status.armorShredUntilMs = 0;
  }
  if (Number(status.poisonUntilMs ?? 0) <= virtualNow) {
    status.poisonDamagePerSecond = 0;
    status.poisonUntilMs = 0;
  }
  return { ...next, statusEffects: status };
}

function attackEnemy(working, index, definition, placed, towers, virtualNow, scale = 1) {
  const enemy = working[index];
  if (!enemy || Number(enemy.hp ?? 0) <= 0) return;

  let target = enemy;
  if (definition.armorShred) {
    target = applyStrongestArmorShred(
      target,
      definition.armorShred,
      virtualNow + Number(definition.armorShredDurationMs ?? 0)
    );
  }

  const combo = getTowerComboDamageMultiplier(placed.defenseId, target);
  const damage = getTowerHitDamage(definition, placed, target, towers, NORMAL_MODE_TOWERS_BY_ID) * scale * combo;
  let damaged = applyEnemyDamage(target, damage, definition.damageType);
  let statusEffects = { ...(damaged.statusEffects ?? {}) };

  if (definition.slowPercent) {
    statusEffects = applyStrongestTimedEffect(statusEffects, {
      valueKey: 'slowPercent',
      untilKey: 'slowUntilMs',
      incomingValue: definition.slowPercent,
      incomingUntilMs: virtualNow + Number(definition.slowDurationMs ?? 0)
    });
  }
  if (definition.vulnerabilityPercent) {
    statusEffects = applyStrongestTimedEffect(statusEffects, {
      valueKey: 'vulnerabilityPercent',
      untilKey: 'vulnerabilityUntilMs',
      incomingValue: definition.vulnerabilityPercent,
      incomingUntilMs: virtualNow + Number(definition.vulnerabilityDurationMs ?? 0)
    });
  }
  if (definition.poisonDamagePerSecond) {
    statusEffects = applyStrongestTimedEffect(statusEffects, {
      valueKey: 'poisonDamagePerSecond',
      untilKey: 'poisonUntilMs',
      incomingValue: definition.poisonDamagePerSecond,
      incomingUntilMs: virtualNow + Number(definition.poisonDurationMs ?? 0)
    });
  }

  working[index] = { ...damaged, statusEffects };
}

function simulateTowerAttacks(snapshot, dtMs, virtualNow, engine) {
  let enemies = (snapshot.activeEnemies ?? []).map((enemy) => ({
    ...enemy,
    position: getPathPosition(getEnemyPath(snapshot.run.mode, enemy), enemy.progress)
  }));

  const towers = normalizedTowers(snapshot);
  const synergy = getTowerSynergyState(towers, NORMAL_MODE_TOWERS_BY_ID);
  engine.towerCooldownMs ??= {};

  for (const placed of towers) {
    const base = NORMAL_MODE_TOWERS_BY_ID[placed.defenseId];
    if (!base) continue;

    const definition = applyBlessingTowerIdentity(
      applyTowerSynergy(getRuntimeTowerDefinition(base, placed), synergy),
      snapshot.run.blessings ?? []
    );
    const interval = getEffectiveTowerAttackInterval(definition, placed, towers, NORMAL_MODE_TOWERS_BY_ID);
    let cooldown = Number(engine.towerCooldownMs[placed.id] ?? 0) - dtMs;
    let guard = 0;

    while (cooldown <= 0 && guard < 48) {
      guard += 1;
      const candidates = getTowerTargets(definition, placed, enemies.filter((enemy) => Number(enemy.hp ?? 0) > 0));
      const primary = candidates[0];
      if (!primary) {
        cooldown = Math.max(0, cooldown);
        break;
      }

      const primaryIndex = enemies.findIndex((enemy) => enemy.id === primary.id);
      if (primaryIndex < 0) break;
      attackEnemy(enemies, primaryIndex, definition, placed, towers, virtualNow, 1);

      if (definition.splashRadius) {
        enemies.forEach((enemy, index) => {
          if (enemy.id === primary.id || Number(enemy.hp ?? 0) <= 0) return;
          const dx = Number(enemy.position?.x ?? 0) - Number(primary.position?.x ?? 0);
          const dy = Number(enemy.position?.y ?? 0) - Number(primary.position?.y ?? 0);
          if (Math.hypot(dx, dy) <= definition.splashRadius) {
            attackEnemy(enemies, index, definition, placed, towers, virtualNow, 0.72);
          }
        });
      }

      if (definition.chainTargets && definition.chainTargets > 1) {
        enemies
          .filter((enemy) => enemy.id !== primary.id && Number(enemy.hp ?? 0) > 0)
          .sort((a, b) => {
            const da = Math.hypot(Number(a.position?.x ?? 0) - Number(primary.position?.x ?? 0), Number(a.position?.y ?? 0) - Number(primary.position?.y ?? 0));
            const db = Math.hypot(Number(b.position?.x ?? 0) - Number(primary.position?.x ?? 0), Number(b.position?.y ?? 0) - Number(primary.position?.y ?? 0));
            return da - db;
          })
          .slice(0, definition.chainTargets - 1)
          .forEach((enemy, chainIndex) => {
            const index = enemies.findIndex((entry) => entry.id === enemy.id);
            if (index >= 0) {
              attackEnemy(enemies, index, definition, placed, towers, virtualNow, Math.pow(definition.chainFalloff ?? 0.65, chainIndex + 1));
            }
          });
      }

      cooldown += interval;
    }

    engine.towerCooldownMs[placed.id] = Math.max(0, cooldown);
  }

  return enemies.map(({ position, ...enemy }) => enemy);
}

function updateDeathRecap(run, escaped, damage) {
  const recap = run.deathRecap ?? { nexusDamage: 0, escapedEnemies: 0, byUnitType: {}, byFaction: {}, lastThreat: null };
  const byUnitType = { ...(recap.byUnitType ?? {}) };
  const byFaction = { ...(recap.byFaction ?? {}) };
  for (const enemy of escaped) {
    const unitType = String(enemy?.unitType ?? 'unknown');
    const faction = String(enemy?.faction ?? 'unknown');
    byUnitType[unitType] = Number(byUnitType[unitType] ?? 0) + 1;
    byFaction[faction] = Number(byFaction[faction] ?? 0) + 1;
  }
  const last = escaped.at(-1) ?? null;
  return {
    nexusDamage: Number(recap.nexusDamage ?? 0) + damage,
    escapedEnemies: Number(recap.escapedEnemies ?? 0) + escaped.length,
    byUnitType,
    byFaction,
    lastThreat: last ? { name: last.name ?? last.archetype ?? 'Enemy', unitType: last.unitType ?? 'unknown', faction: last.faction ?? 'unknown' } : recap.lastThreat ?? null
  };
}

function applyWaveClear(snapshot) {
  const run = { ...snapshot.run };
  const completedWave = Math.max(1, Number(run.wave ?? 0) + 1);
  const ctx = waveContext(snapshot);

  const baseGold =
    run.mode === 'tri-gate' ? getTriGateWaveClearReward(completedWave)
      : run.mode === 'sudden-siege' ? getSuddenSiegeWaveReward(completedWave)
        : run.mode === 'tft-shop' ? TFT_SHOP.waveClearGold
          : getWaveClearReward(completedWave);

  const rewardConfig = run.mode === 'sudden-siege' ? SUDDEN_SIEGE : TFT_SHOP;
  const perfect = isShopMode(run.mode) && Number(run.coreHp ?? 0) >= Number(run.waveStartCoreHp ?? run.coreHp ?? 0);
  const shopBonus = isShopMode(run.mode)
    ? (perfect ? rewardConfig.perfectWaveBonus : 0) +
      (isBossWave(completedWave) ? rewardConfig.bossWaveBonus : 0) +
      (completedWave % rewardConfig.milestoneInterval === 0 ? rewardConfig.milestoneWaveBonus : 0)
    : 0;

  const world = getWorldModifierEffects(getActiveWorldModifiers(run.seed ?? 'run', completedWave));
  const modeGold = isShopMode(run.mode)
    ? baseGold + shopBonus
    : Math.max(0, Math.round(applyBlessingWaveGold(baseGold, run.blessings ?? []) * world.waveGoldMultiplier));

  const waveGold = applyRiskRewardGold(modeGold, run.mode, snapshot.riskRewardTier ?? 'safe');
  const milestone = ['single-gate', 'tft-shop'].includes(run.mode)
    ? getEndlessMilestone(completedWave, run.mode)
    : null;

  const miniObjective = getMiniObjectiveForWave(completedWave);
  const factionCount = new Set((snapshot.placedDefenses ?? [])
    .map((tower) => NORMAL_MODE_TOWERS_BY_ID[tower.defenseId]?.faction)
    .filter(Boolean)).size;
  const objectiveComplete = evaluateMiniObjective(miniObjective, {
    coreHp: run.coreHp,
    waveStartCoreHp: run.waveStartCoreHp,
    placedTowerCount: (snapshot.placedDefenses ?? []).length,
    factionCount,
    riskRewardTier: snapshot.riskRewardTier ?? 'safe',
    gold: run.gold,
    evolvedTowerCount: (snapshot.placedDefenses ?? []).filter((tower) => Boolean(tower.evolution)).length
  });
  const objectiveGold = objectiveComplete ? getMiniObjectiveReward(run.mode) : 0;
  const rareGold = Number(ctx.rare?.bonusGold ?? 0);
  const nextMaxHp = getBlessingAdjustedMaxHp(BASE_CORE_HP, run.blessings ?? []);
  const maxHpGain = Math.max(0, nextMaxHp - Number(run.coreMaxHp ?? BASE_CORE_HP));

  run.phase = 'preparation';
  run.wave = Number(run.wave ?? 0) + 1;
  run.gold = Number(run.gold ?? 0) + waveGold + Number(milestone?.goldReward ?? 0) + objectiveGold + rareGold;
  run.coreMaxHp = nextMaxHp;
  run.coreHp = Math.min(nextMaxHp, Number(run.coreHp ?? 0) + maxHpGain);

  snapshot.run = run;
  snapshot.preparationRemaining = getPreparationSeconds(run.mode, snapshot);
  snapshot.spawnQueue = [];
  snapshot.activeEnemies = [];
  snapshot.queuedWaveNumber = null;
  snapshot.spawnedWaveNumber = null;
  snapshot.riskRewardTier = 'safe';
  snapshot.offlineBlockedReason = null;
}

function spawnBossAddsIfDue(snapshot, engine) {
  const ctx = waveContext(snapshot);
  if (!ctx.bossWave) return;
  const plan = getBossSummonAddsPlan(ctx.wave);
  const fired = new Set(snapshot.bossSummonFiredKeys ?? []);
  for (const pulse of plan.pulses) {
    const key = `${ctx.wave}:${pulse.pulseIndex}`;
    if (fired.has(key) || Number(engine.currentWaveElapsedMs ?? 0) < pulse.offsetMs) continue;
    fired.add(key);
    const adds = snapshot.run.mode === 'tri-gate'
      ? pulse.adds.map((enemy, index) => ({
          ...enemy,
          laneId: TRI_GATE_MAP.pathPlan.lanes[index % TRI_GATE_MAP.pathPlan.lanes.length].id
        }))
      : pulse.adds;
    snapshot.spawnQueue.push(...adds.map((enemy, index) => ({
      ...enemy,
      id: enemy.id ?? `boss-${ctx.wave}-pulse-${pulse.pulseIndex}-add-${index + 1}`,
      scheduledSpawnOffsetMs: Number(pulse.offsetMs ?? 0)
    })));
    snapshot.spawnQueue.sort(
      (a, b) => Number(a.scheduledSpawnOffsetMs ?? 0) - Number(b.scheduledSpawnOffsetMs ?? 0)
    );
  }
  snapshot.bossSummonFiredKeys = Array.from(fired);
}

function applyOfflineWallDamage(snapshot, dtMs) {
  const activeWallIds = [...(snapshot.activeWallIds ?? [])];
  if (activeWallIds.length === 0) return;

  const tickScale = Math.max(0, Number(dtMs) || 0) / Math.max(1, WALL_SYSTEM.damageTickMs);
  if (tickScale <= 0) return;

  const nextHp = { ...(snapshot.wallHpById ?? {}) };
  const destroyed = [];

  for (const wallId of activeWallIds) {
    const targetProgress = WALL_PROGRESS_BY_ID[wallId];
    if (!Number.isFinite(targetProgress)) continue;

    let damagePerTick = 0;
    for (const enemy of snapshot.activeEnemies ?? []) {
      if (enemy?.airborne || Number(enemy?.hp ?? 0) <= 0) continue;
      if (Math.abs(Number(enemy?.progress ?? 0) - targetProgress) > 0.045) continue;
      damagePerTick += enemy.unitType === 'armored'
        ? WALL_SYSTEM.armoredDamagePerTick
        : WALL_SYSTEM.infantryDamagePerTick;
    }

    if (damagePerTick <= 0) continue;
    const hp = Math.max(0, Number(nextHp[wallId] ?? WALL_SYSTEM.maxHp) - damagePerTick * tickScale);
    nextHp[wallId] = hp;
    if (hp <= 0) destroyed.push(wallId);
  }

  snapshot.wallHpById = nextHp;
  if (destroyed.length > 0) {
    snapshot.activeWallIds = activeWallIds.filter((wallId) => !destroyed.includes(wallId));
  }
}

function activeStep(snapshot, dtMs, engine) {
  const run = { ...snapshot.run };
  const ctx = waveContext(snapshot);
  const waveSpeed = Math.max(1, Number(snapshot.waveSpeed ?? 1));
  const simulationDtMs = Math.max(0, Number(dtMs) || 0) * waveSpeed;
  const virtualNow = Number(engine.virtualNowMs ?? snapshot.waveClockNow ?? 0) + simulationDtMs;
  engine.virtualNowMs = virtualNow;
  engine.currentWaveElapsedMs = Number(engine.currentWaveElapsedMs ?? 0) + simulationDtMs;
  engine.spawnAccumulatorMs = Number(engine.spawnAccumulatorMs ?? 0) + simulationDtMs;

  spawnBossAddsIfDue(snapshot, engine);

  while (
    snapshot.spawnQueue.length > 0 &&
    Number(snapshot.spawnQueue[0]?.scheduledSpawnOffsetMs ?? 0) <= Number(engine.currentWaveElapsedMs ?? 0)
  ) {
    const item = snapshot.spawnQueue.shift();
    const overdueMs = Math.max(
      0,
      Number(engine.currentWaveElapsedMs ?? 0) - Number(item?.scheduledSpawnOffsetMs ?? 0)
    );
    const exactSpawnedAt = virtualNow - Math.min(simulationDtMs, overdueMs);
    const spawned = createEnemyState(item, snapshot, virtualNow, exactSpawnedAt);
    if (spawned) snapshot.activeEnemies.push(spawned);
  }

  const blessing = getBlessingModifiers(run.blessings ?? []);
  const moveMultiplier = blessing.enemyMoveSpeedMultiplier * ctx.world.enemyMoveSpeedMultiplier;

  let enemies = (snapshot.activeEnemies ?? []).map((enemy) => applyStatusTick(enemy, simulationDtMs, virtualNow));
  enemies = enemies.map((enemy) => {
    const speed = getEnemyEffectiveSpeed(enemy, virtualNow) * 0.48 * moveMultiplier;
    const enemyStepMs = Math.min(
      simulationDtMs,
      Math.max(0, virtualNow - Number(enemy.spawnedAt ?? (virtualNow - simulationDtMs)))
    );
    let progress = Math.min(1, Number(enemy.progress ?? 0) + (enemyStepMs / Math.max(1, ctx.scaling.travelDurationMs)) * speed);

    if (!enemy.airborne && (snapshot.activeWallIds ?? []).length > 0) {
      const wall = Object.entries(WALL_PROGRESS_BY_ID)
        .filter(([id, p]) => snapshot.activeWallIds.includes(id) && Number(enemy.progress ?? 0) <= p && progress >= p)
        .sort((a, b) => a[1] - b[1])[0];
      if (wall) progress = wall[1];
    }

    return { ...enemy, progress };
  });

  snapshot.activeEnemies = enemies;
  applyOfflineWallDamage(snapshot, simulationDtMs);
  snapshot.activeEnemies = simulateTowerAttacks(snapshot, simulationDtMs, virtualNow, engine);

  const dead = snapshot.activeEnemies.filter((enemy) => Number(enemy.hp ?? 0) <= 0);
  if (dead.length > 0) {
    run.kills = Number(run.kills ?? 0) + dead.length;
    if (run.mode === 'single-gate') {
      run.gold = Number(run.gold ?? 0) + dead.reduce((sum, enemy) => sum + getEnemyKillReward(enemy), 0);
    }
    snapshot.activeEnemies = snapshot.activeEnemies.filter((enemy) => Number(enemy.hp ?? 0) > 0);
  }

  const escaped = snapshot.activeEnemies.filter((enemy) => Number(enemy.progress ?? 0) >= 1);
  if (escaped.length > 0) {
    const rawDamage = escaped.length * Number(ctx.scaling.bastionDamage ?? 1);
    const damage = applyBlessingBastionDamage(rawDamage, run.coreHp, run.coreMaxHp, run.blessings ?? []);
    run.coreHp = Math.max(0, Number(run.coreHp ?? 0) - damage);
    run.bastionHitId = Number(run.bastionHitId ?? 0) + 1;
    run.deathRecap = updateDeathRecap(run, escaped, damage);
    snapshot.activeEnemies = snapshot.activeEnemies.filter((enemy) => Number(enemy.progress ?? 0) < 1);
  }

  if (run.coreHp <= 0) {
    run.phase = 'ended';
    run.result = 'bastion-destroyed';
    run.endedAtMs = Date.now();
    run.elapsedMs = Math.max(Number(run.elapsedMs ?? 0), Number(run.endedAtMs) - Number(run.startedAtMs ?? run.endedAtMs));
    run.endSnapshot = createRunEndSnapshot(run, 'bastion-destroyed');
    snapshot.offlineBlockedReason = 'run-ended';
  } else if (snapshot.spawnQueue.length === 0 && snapshot.activeEnemies.length === 0) {
    run.phase = 'resolving';
    if (ctx.bossWave) snapshot.offlineBlockedReason = 'blessing-choice';
  }

  snapshot.run = run;
  snapshot.waveClockNow = virtualNow;
}

export function advanceOfflineRunSnapshot(inputSnapshot, offlineElapsedMs) {
  const snapshot = structuredClone(inputSnapshot ?? {});
  if (!snapshot?.run || !SUPPORTED_MODES.has(snapshot.run.mode)) {
    return Object.freeze({ snapshot, advancedMs: 0, remainingMs: Math.max(0, Number(offlineElapsedMs) || 0), blockedReason: 'unsupported-mode' });
  }
  if (snapshot.run.phase === 'ended') {
    return Object.freeze({ snapshot, advancedMs: 0, remainingMs: 0, blockedReason: 'run-ended' });
  }

  let remaining = Math.min(MAX_OFFLINE_MS, Math.max(0, Number(offlineElapsedMs) || 0));
  const total = remaining;
  const stepMs = Math.max(250, Math.ceil(remaining / MAX_SIMULATION_STEPS / 50) * 50 || 250);
  const engine = {
    ...(snapshot.offlineEngine ?? {}),
    towerCooldownMs: { ...(snapshot.offlineEngine?.towerCooldownMs ?? {}) },
    virtualNowMs: Number(snapshot.offlineEngine?.virtualNowMs ?? snapshot.waveClockNow ?? 0)
  };

  let guard = 0;
  while (remaining > 0 && guard < MAX_SIMULATION_STEPS && snapshot.run.phase !== 'ended') {
    guard += 1;
    const dt = Math.min(stepMs, remaining);

    if (snapshot.run.phase === 'preparation') {
      const prepMs = Math.max(0, Number(snapshot.preparationRemaining ?? getPreparationSeconds(snapshot.run.mode, snapshot)) * 1000);
      if (prepMs > dt) {
        snapshot.preparationRemaining = Math.max(0, (prepMs - dt) / 1000);
      } else {
        snapshot.preparationRemaining = 0;
        snapshot.run = { ...snapshot.run, phase: 'active', waveStartCoreHp: snapshot.run.coreHp };
        snapshot.spawnQueue = buildWaveQueue(snapshot);
        snapshot.queuedWaveNumber = Math.max(1, Number(snapshot.run.wave ?? 0) + 1);
        snapshot.spawnedWaveNumber = null;
        snapshot.activeEnemies ??= [];
        engine.spawnAccumulatorMs = Math.max(0, dt - prepMs);
        engine.currentWaveElapsedMs = 0;
        engine.towerCooldownMs = {};
      }
    } else if (snapshot.run.phase === 'active') {
      const currentWave = Math.max(1, Number(snapshot.run.wave ?? 0) + 1);
      const queueKnown = Number(snapshot.queuedWaveNumber) === currentWave;
      const spawnedKnown = Number(snapshot.spawnedWaveNumber) === currentWave;

      if ((snapshot.spawnQueue?.length ?? 0) === 0 && (snapshot.activeEnemies?.length ?? 0) === 0 && !queueKnown) {
        snapshot.spawnQueue = buildWaveQueue(snapshot);
        snapshot.queuedWaveNumber = currentWave;
        engine.spawnAccumulatorMs = 0;
        engine.currentWaveElapsedMs = 0;
      } else if ((snapshot.spawnQueue?.length ?? 0) === 0 && (snapshot.activeEnemies?.length ?? 0) === 0 && queueKnown && spawnedKnown) {
        snapshot.run = { ...snapshot.run, phase: 'resolving' };
        if (isBossWave(currentWave)) snapshot.offlineBlockedReason = 'blessing-choice';
      } else {
        activeStep(snapshot, dt, engine);
        if ((snapshot.activeEnemies?.length ?? 0) > 0) snapshot.spawnedWaveNumber = currentWave;
      }
    } else if (snapshot.run.phase === 'resolving') {
      if (isBossWave(Number(snapshot.run.wave ?? 0) + 1)) {
        snapshot.offlineBlockedReason = 'blessing-choice';
        break;
      }
      applyWaveClear(snapshot);
      engine.currentWaveElapsedMs = 0;
      engine.spawnAccumulatorMs = 0;
      engine.towerCooldownMs = {};
    } else {
      break;
    }

    remaining -= dt;
  }

  snapshot.offlineEngine = engine;
  snapshot.savedAt = Date.now();
  const advancedMs = total - remaining;

  return Object.freeze({
    snapshot,
    advancedMs,
    remainingMs: Math.max(0, Number(offlineElapsedMs) || 0) - advancedMs,
    blockedReason: snapshot.offlineBlockedReason ?? null
  });
}

export function getOfflineRunEngineFixtures() {
  const snapshot = {
    run: {
      mode: 'single-gate',
      seed: 'offline-fixture',
      phase: 'preparation',
      wave: 0,
      gold: ECONOMY_BASELINE.startingGold,
      coreHp: BASE_CORE_HP,
      coreMaxHp: BASE_CORE_HP,
      waveStartCoreHp: BASE_CORE_HP,
      kills: 0,
      blessings: [],
      startedAtMs: Date.now()
    },
    placedDefenses: [],
    activeWallIds: [],
    wallHpById: {},
    spawnQueue: [],
    activeEnemies: [],
    preparationRemaining: 1,
    waveSpeed: 1,
    riskRewardTier: 'safe'
  };

  const advanced = advanceOfflineRunSnapshot(snapshot, 1500);

  const wallSnapshot = {
    run: {
      mode: 'single-gate',
      seed: 'offline-wall-fixture',
      phase: 'active',
      wave: 0,
      gold: ECONOMY_BASELINE.startingGold,
      coreHp: BASE_CORE_HP,
      coreMaxHp: BASE_CORE_HP,
      waveStartCoreHp: BASE_CORE_HP,
      kills: 0,
      blessings: [],
      startedAtMs: Date.now()
    },
    placedDefenses: [],
    activeWallIds: ['wall-01'],
    wallHpById: { 'wall-01': 10 },
    spawnQueue: [],
    activeEnemies: [{
      id: 'wall-attacker',
      hp: 1000,
      maxHp: 1000,
      shield: 0,
      maxShield: 0,
      armor: 0,
      moveSpeed: 1,
      progress: WALL_PROGRESS_BY_ID['wall-01'],
      airborne: false,
      unitType: 'infantry',
      faction: 'human',
      bastionDamage: 1,
      goldReward: 0,
      statusEffects: {}
    }],
    preparationRemaining: 0,
    waveSpeed: 1,
    riskRewardTier: 'safe',
    queuedWaveNumber: 1,
    spawnedWaveNumber: 1
  };
  const wallAdvanced = advanceOfflineRunSnapshot(wallSnapshot, 1000);

  const clockBase = {
    run: {
      mode: 'single-gate',
      seed: 'clock-fixture',
      phase: 'active',
      wave: 0,
      gold: ECONOMY_BASELINE.startingGold,
      coreHp: BASE_CORE_HP,
      coreMaxHp: BASE_CORE_HP,
      waveStartCoreHp: BASE_CORE_HP,
      kills: 0,
      blessings: [],
      startedAtMs: Date.now()
    },
    placedDefenses: [],
    activeWallIds: [],
    wallHpById: {},
    spawnQueue: [],
    activeEnemies: [{
      id: 'clock-enemy',
      hp: 1000,
      maxHp: 1000,
      shield: 0,
      maxShield: 0,
      armor: 0,
      moveSpeed: 0.2,
      progress: 0,
      airborne: false,
      unitType: 'infantry',
      faction: 'human',
      bastionDamage: 1,
      goldReward: 0,
      statusEffects: {
        poisonDamagePerSecond: 10,
        poisonUntilMs: 10000
      }
    }],
    preparationRemaining: 0,
    riskRewardTier: 'safe',
    queuedWaveNumber: 1,
    spawnedWaveNumber: 1,
    waveClockNow: 0,
    offlineEngine: { virtualNowMs: 0, currentWaveElapsedMs: 0, towerCooldownMs: {} }
  };
  const normalClock = advanceOfflineRunSnapshot({ ...structuredClone(clockBase), waveSpeed: 1 }, 1000);
  const doubleClock = advanceOfflineRunSnapshot({ ...structuredClone(clockBase), waveSpeed: 2 }, 1000);
  const normalEnemy = normalClock.snapshot.activeEnemies.find((enemy) => enemy.id === 'clock-enemy');
  const doubleEnemy = doubleClock.snapshot.activeEnemies.find((enemy) => enemy.id === 'clock-enemy');

  return Object.freeze({
    supportedModeAdvances: advanced.advancedMs > 0,
    preparationCanStartWave: advanced.snapshot.run.phase === 'active' || advanced.snapshot.run.phase === 'resolving' || advanced.snapshot.run.phase === 'ended',
    generatedWaveQueue: advanced.snapshot.spawnQueue.length > 0 || advanced.snapshot.activeEnemies.length > 0 || advanced.snapshot.run.phase !== 'active',
    offlineWallsTakeDamage: Number(wallAdvanced.snapshot.wallHpById?.['wall-01'] ?? 0) < 10,
    offlineWallsCanBeDestroyed: !wallAdvanced.snapshot.activeWallIds?.includes('wall-01'),
    x2AdvancesDoubleVirtualTime:
      Number(doubleClock.snapshot.waveClockNow ?? 0) === Number(normalClock.snapshot.waveClockNow ?? 0) * 2,
    x2AppliesMoreTimedDamage:
      Number(doubleEnemy?.hp ?? 1000) < Number(normalEnemy?.hp ?? 1000)
  });
}
