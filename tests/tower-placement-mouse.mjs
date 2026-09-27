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
const slots = Array.from({ length: 15 }, (_, index) => `slot-${String(index + 1).padStart(2, '0')}`);
const startingGold = 240;

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1600, height: 1000 } });

try {
  for (const defense of defenses) {
    for (const slotId of slots) {
      await page.goto(baseUrl, { waitUntil: 'networkidle' });

      const sidebar = page.locator('.run-sidebar');
      await sidebar.waitFor({ state: 'visible' });

      const fixturePass = await sidebar.getAttribute('data-tower-slot-purchase-pass');
      assert(fixturePass === 'true', 'Purchase fixture failed before mouse QA');

      const slotCount = Number(await sidebar.getAttribute('data-tower-slot-count'));
      assert(slotCount === slots.length, `Expected ${slots.length} slots, got ${slotCount}`);

      await page.locator(`[data-tower-id="${defense.id}"]`).click();

      const slot = page.locator(`[data-slot-id="${slotId}"]`);
      await slot.waitFor({ state: 'visible' });
      assert((await slot.getAttribute('data-occupied')) === 'false', `${slotId} should begin empty`);

      await slot.hover();
      await page.waitForTimeout(80);

      const ghost = slot.locator('.tower-visual--ghost');
      assert(await ghost.count() === 1, `Ghost preview missing for ${defense.id} on ${slotId}`);
      const ghostOpacity = Number(await ghost.evaluate((node) => getComputedStyle(node).opacity));
      assert(ghostOpacity > 0, `Ghost preview stayed hidden for ${defense.id} on ${slotId}`);

      const box = await slot.boundingBox();
      assert(box, `No mouse target box for ${slotId}`);
      const x = box.x + box.width / 2;
      const y = box.y + box.height / 2;

      await page.mouse.click(x, y);
      await page.waitForTimeout(80);

      assert((await slot.getAttribute('data-occupied')) === 'true', `${defense.id} did not occupy ${slotId}`);
      assert((await slot.getAttribute('data-defense-id')) === defense.id, `Wrong defense built on ${slotId}`);

      const goldAfter = Number(await sidebar.getAttribute('data-run-gold'));
      assert(goldAfter === startingGold - defense.cost, `Gold deduction wrong for ${defense.id} on ${slotId}: ${goldAfter}`);

      const placedCount = Number(await sidebar.getAttribute('data-placed-defense-count'));
      assert(placedCount === 1, `Expected one placed defense, got ${placedCount}`);

      await page.mouse.click(x, y);
      await page.waitForTimeout(40);

      assert(Number(await sidebar.getAttribute('data-run-gold')) === goldAfter, `Occupied slot charged gold again for ${slotId}`);
      assert(Number(await sidebar.getAttribute('data-placed-defense-count')) === 1, `Occupied slot accepted a second tower for ${slotId}`);

      const inspector = page.locator('.defense-inspector__header');
      const inspectorText = await inspector.innerText();
      assert(inspectorText.includes('PLACED DEFENSE'), `Occupied slot did not select placed defense on ${slotId}`);
    }
  }

  console.log(`PASS: mouse placement verified across ${defenses.length} defense types × ${slots.length} slots = ${defenses.length * slots.length} combinations.`);
} finally {
  await browser.close();
}
