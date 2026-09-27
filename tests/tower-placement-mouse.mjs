import { chromium } from 'playwright';

const baseUrl = 'http://127.0.0.1:4173/?qa=tower-placement';
const defenses = [
  { id: 'human-aa', cost: 70, name: 'Human Anti-Air' },
  { id: 'human-armor', cost: 110, name: 'Human Anti-Armor' },
  { id: 'human-infantry', cost: 95, name: 'Human Anti-Infantry' },
  { id: 'insect-aa', cost: 72, name: 'Insect Anti-Air' },
  { id: 'insect-armor', cost: 105, name: 'Insect Anti-Armor' },
  { id: 'insect-infantry', cost: 88, name: 'Insect Anti-Infantry' },
  { id: 'alien-aa', cost: 92, name: 'Alien Anti-Air' },
  { id: 'alien-armor', cost: 118, name: 'Alien Anti-Armor' },
  { id: 'alien-infantry', cost: 102, name: 'Alien Anti-Infantry' },
  { id: 'slow', cost: 82, name: 'Slow Tower' },
  { id: 'debuff', cost: 86, name: 'Debuff Tower' },
  { id: 'buff', cost: 90, name: 'Buff Tower' }
];
const slots = Array.from({ length: 28 }, (_, index) => `slot-${String(index + 1).padStart(2, '0')}`);
const startingGold = 240;

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1600, height: 1000 } });

async function openFixture() {
  await page.goto(baseUrl, { waitUntil: 'domcontentloaded' });
  const sidebar = page.locator('.run-sidebar');
  await sidebar.waitFor({ state: 'visible' });

  const fixturePass = await sidebar.getAttribute('data-tower-slot-purchase-pass');
  assert(fixturePass === 'true', '12×28 purchase fixture failed before mouse QA');

  const slotCount = Number(await sidebar.getAttribute('data-tower-slot-count'));
  assert(slotCount === slots.length, `Expected ${slots.length} slots, got ${slotCount}`);
  return sidebar;
}

async function verifyMousePlacement(defense, slotId, { verifyOccupiedClick = false } = {}) {
  const sidebar = await openFixture();

  await page.locator(`[data-tower-id="${defense.id}"]`).click();

  const slot = page.locator(`[data-slot-id="${slotId}"]`);
  await slot.waitFor({ state: 'visible' });
  assert((await slot.getAttribute('data-occupied')) === 'false', `${slotId} should begin empty`);

  await slot.hover();
  const ghost = slot.locator('.tower-visual--ghost');
  assert(await ghost.count() === 1, `Ghost preview missing for ${defense.id} on ${slotId}`);
  const ghostOpacity = Number(await ghost.evaluate((node) => getComputedStyle(node).opacity));
  assert(ghostOpacity > 0, `Ghost preview stayed hidden for ${defense.id} on ${slotId}`);

  const box = await slot.boundingBox();
  assert(box, `No mouse target box for ${slotId}`);
  const x = box.x + box.width / 2;
  const y = box.y + box.height / 2;

  await page.mouse.click(x, y);
  await page.waitForFunction(
    ({ slotId: id, defenseId }) => {
      const node = document.querySelector(`[data-slot-id="${id}"]`);
      return node?.getAttribute('data-occupied') === 'true' &&
        node?.getAttribute('data-defense-id') === defenseId;
    },
    { slotId, defenseId: defense.id }
  );

  const goldAfter = Number(await sidebar.getAttribute('data-run-gold'));
  assert(goldAfter === startingGold - defense.cost, `Gold deduction wrong for ${defense.id} on ${slotId}: ${goldAfter}`);
  assert(Number(await sidebar.getAttribute('data-placed-defense-count')) === 1, 'Expected exactly one placed defense');

  if (verifyOccupiedClick) {
    await page.mouse.click(x, y);
    assert(Number(await sidebar.getAttribute('data-run-gold')) === goldAfter, `Occupied slot charged gold again for ${slotId}`);
    assert(Number(await sidebar.getAttribute('data-placed-defense-count')) === 1, `Occupied slot accepted a second tower for ${slotId}`);

    const inspectorText = await page.locator('.defense-inspector__header').innerText();
    assert(inspectorText.includes('PLACED DEFENSE'), `Occupied slot did not select placed defense on ${slotId}`);
  }
}

try {
  // Geometry/pointer coverage: every curated slot must be reachable with a real mouse.
  for (const slotId of slots) {
    await verifyMousePlacement(defenses[0], slotId, { verifyOccupiedClick: slotId === slots[0] });
  }

  // Roster coverage: every base tower must be selectable, purchasable and charge its own cost.
  for (const defense of defenses.slice(1)) {
    await verifyMousePlacement(defense, slots[0]);
  }

  console.log('PASS: tower placement browser QA', {
    logicalMatrix: `${defenses.length}x${slots.length}`,
    mouseSlotCoverage: slots.length,
    mouseTowerCoverage: defenses.length,
    explicitPointerCollisionCoverage: true
  });
} finally {
  await browser.close();
}
