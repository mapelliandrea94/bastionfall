import { chromium } from 'playwright';

const baseUrl = 'http://127.0.0.1:4173/?qa=tower-placement';

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const browser = await chromium.launch({ headless: true });

try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.goto(baseUrl, { waitUntil: 'networkidle' });

  const firstSlot = page.locator('[data-slot-id="slot-01"]');
  await firstSlot.waitFor({ state: 'visible' });

  assert(await firstSlot.getAttribute('role') === 'button', 'Tower slot must expose button semantics');
  assert(await firstSlot.getAttribute('tabindex') === '0', 'Tower slot must be keyboard focusable');
  assert(Boolean(await firstSlot.getAttribute('aria-label')), 'Tower slot must have an accessible label');

  await firstSlot.focus();
  await page.keyboard.press('Enter');
  await page.waitForTimeout(80);
  assert(await firstSlot.getAttribute('data-occupied') === 'true', 'Enter key must activate tower placement');

  await page.emulateMedia({ reducedMotion: 'reduce' });
  const reducedMotionDuration = await firstSlot.evaluate((node) => getComputedStyle(node).transitionDuration);
  assert(reducedMotionDuration === '0.000001s' || reducedMotionDuration === '0s', 'Reduced-motion preference must suppress transitions');

  const mobile = await browser.newPage({ viewport: { width: 390, height: 844 } });
  await mobile.goto(baseUrl, { waitUntil: 'networkidle' });

  const hud = mobile.locator('.run-hud');
  const sidebar = mobile.locator('.run-sidebar');
  const hudBox = await hud.boundingBox();
  const sidebarBox = await sidebar.boundingBox();

  assert(hudBox && hudBox.x >= 0 && hudBox.x + hudBox.width <= 390, 'Mobile HUD must stay inside viewport');
  assert(sidebarBox && sidebarBox.x >= 0 && sidebarBox.x + sidebarBox.width <= 390, 'Mobile sidebar must stay inside viewport');
  assert(sidebarBox.height <= 270, 'Mobile sidebar must not consume most of the battlefield');

  console.log('Accessibility/responsive QA PASS');
} finally {
  await browser.close();
}
