import { expect, test } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

for (const name of ['router', 'fragments', 'ui']) {
  test(`classic ${name} bundle reports missing core`, async ({ page }) => {
    const error = page.waitForEvent('pageerror');
    await page.addScriptTag({ path: `dist/plainui-${name}.js` });
    expect((await error).message).toContain(`PlainUI core must load before plainui-${name}.js`);
  });
}

test('classic optional bundles register through the existing core bridge', async ({ page }) => {
  await page.addScriptTag({ path: 'dist/plainui.js' });
  for (const name of ['router', 'fragments', 'ui']) {
    await page.addScriptTag({ path: `dist/plainui-${name}.js` });
  }
  const modules = await page.evaluate(() => {
    const host = globalThis as typeof globalThis & {
      PlainUI: { create(): { installedModules: readonly string[] } };
    };
    return host.PlainUI.create().installedModules;
  });
  expect(modules).toEqual(['router', 'fragments', 'ui']);
});

test('ESM installers return the same App through the relative main bridge', async ({ page }) => {
  await page.route('http://plainui.test/**', async (route) => {
    const file = new URL(route.request().url()).pathname.slice(1);
    if (!file) {
      await route.fulfill({ contentType: 'text/html', body: '<!doctype html><title>PlainUI ESM build</title>' });
      return;
    }
    await route.fulfill({
      contentType: 'text/javascript',
      body: await readFile(join(process.cwd(), 'dist', file)),
    });
  });
  await page.goto('http://plainui.test/');
  const installed = await page.evaluate(async () => {
    const { PlainUI } = await import('http://plainui.test/plainui.mjs');
    const { installRouter } = await import('http://plainui.test/plainui-router.mjs');
    const { installFragments } = await import('http://plainui.test/plainui-fragments.mjs');
    const { installUI } = await import('http://plainui.test/plainui-ui.mjs');
    const app = PlainUI.create();
    const same = installRouter(app) === app && installFragments(app) === app && installUI(app) === app;
    return { same, modules: app.installedModules };
  });
  expect(installed).toEqual({ same: true, modules: ['router', 'fragments', 'ui'] });
});
