import { chromium } from 'playwright';

const baseUrl = 'http://127.0.0.1:4173/?qa=tower-placement';
const defenses = [
  { id: 'archer', cost: 70, name: 'Archer Tower' },
  { id: 'cannon', cost: 110, name: 'Cannon Tower' },
  { id: 'frost', cost: 90, name: 'Frost Tower' },
  { id: 'mage', cost: 125, name: 'Mage Tower' },
  { id: 'ballista', cost: 145, name: 'Ballista Tower' },
  { id: 'barracks', cost: 130, name: 'Barracks' }
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

      await page.locator(`.tower-card--${defense.id}`).click();

      const slot = page.locator(`[data-slot-id="${slotId}"]`);
      await slot.waitFor({ state: 'visible' });
      assert((await slot.getAttribute('data-occupied')) === 'false', `${slotId} should begin empty`);

      const box = await slot.boundingBox();
      assert(box, `No mouse target box for ${slotId}`);
      const x = box.x + box.width / 2;
      const y = box.y + box.height / 2;

      await page.mouse.move(x, y);
      await page.waitForTimeout(40);
      assert(
        await slot.locator('.tower-visual--ghost').count() === 1,
        `Ghost preview missing for ${defense.id} on ${slotId}`
      );

      await page.mouse.click(x, y);
      await page.waitForTimeout(40);

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
