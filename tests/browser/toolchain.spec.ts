import { expect, test } from '@playwright/test';
import { readFileSync } from 'node:fs';

test('browser loads the classic and ESM toolchain bundles', async ({ page }) => {
  await page.setContent('<main id="output"></main>');
  await page.addScriptTag({ path: 'dist/smoke/classic.js' });
  const classic = await page.evaluate(() => {
    const api = (globalThis as typeof globalThis & {
      PlainUIToolchainSmoke: { setSmokeText(element: HTMLElement): void };
    }).PlainUIToolchainSmoke;
    const target = document.querySelector<HTMLElement>('#output');
    if (!target) throw new Error('Missing smoke target');
    api.setSmokeText(target);
    return target.textContent;
  });
  expect(classic).toBe('PlainUI toolchain ready: browser');

  await page.locator('#output').evaluate((element) => { element.textContent = ''; });
  const esm = readFileSync(new URL('../../dist/smoke/esm.mjs', import.meta.url), 'utf8');
  await page.addScriptTag({ type: 'module', content: `${esm}\nsetSmokeText(document.querySelector('#output'));` });
  await expect(page.locator('#output')).toHaveText('PlainUI toolchain ready: browser');
});
