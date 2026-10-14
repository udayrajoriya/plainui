import { expect, test } from 'vitest';
import { join, resolve } from 'node:path';
import { checkSourceGraph, loadPackageSources } from '../../scripts/check-boundaries.mjs';

const root = resolve(import.meta.dirname, '../..');
const source = (name: string, file: string): string => join(root, 'packages', name, 'src', file);

test('current package graph has no illegal edges or cycles', async () => {
  expect(checkSourceGraph(await loadPackageSources())).toEqual([]);
});

test('core cannot import an optional module or DOMPurify', () => {
  const files = new Map([
    [source('core', 'illegal.ts'), "import '../../fragments/src/index.js'; import 'dompurify';"],
    [source('fragments', 'index.ts'), 'export const marker = 1;'],
  ]);
  expect(checkSourceGraph(files)).toEqual(expect.arrayContaining([
    expect.stringContaining('crosses core -> fragments'),
    expect.stringContaining('DOMPurify is only allowed in fragments'),
  ]));
});

test('forms may import the data action interface but not its controller', () => {
  const files = new Map([
    [source('forms', 'index.ts'), "import type { A } from '../../data/src/action-service.js'; import '../../data/src/controller.js';"],
    [source('data', 'action-service.ts'), 'export interface A {}'],
    [source('data', 'controller.ts'), 'export const controller = 1;'],
  ]);
  const issues = checkSourceGraph(files);
  expect(issues).toHaveLength(1);
  expect(issues[0]).toContain('crosses forms -> data');
});

test('optional modules cannot import core implementation beyond the bridge', () => {
  const files = new Map([
    [source('router', 'index.ts'), "import '../../core/src/index.js';"],
    [source('core', 'index.ts'), 'export const marker = 1;'],
  ]);
  expect(checkSourceGraph(files)).toEqual([expect.stringContaining('crosses router -> core')]);
});

test('data cannot import private core implementation', () => {
  const files = new Map([
    [source('data', 'index.ts'), "import '../../core/src/private.js';"],
    [source('core', 'private.ts'), 'export const marker = 1;'],
  ]);
  expect(checkSourceGraph(files)).toEqual([expect.stringContaining('crosses data -> core')]);
});

test('cycle and dynamic import probes fail', () => {
  const files = new Map([
    [source('core', 'a.ts'), "import './b.js'; import('./c.js');"],
    [source('core', 'b.ts'), "export * from './a.js';"],
    [source('core', 'c.ts'), 'export const marker = 1;'],
  ]);
  expect(checkSourceGraph(files)).toEqual(expect.arrayContaining([
    expect.stringContaining('BOUNDARY_CYCLE'),
    expect.stringContaining('BOUNDARY_DYNAMIC_IMPORT'),
  ]));
});

test('import-like comments and strings do not create graph edges', () => {
  const files = new Map([
    [source('core', 'a.ts'), "// import '../../ui/src/index.js'\nexport const text = \"import '../../ui/src/index.js'\";"],
  ]);
  expect(checkSourceGraph(files)).toEqual([]);
});

test('dynamic imports inside template interpolation are rejected', () => {
  const files = new Map([
    [source('core', 'a.ts'), "const value = `prefix ${import('./b.js')}`;"],
    [source('core', 'b.ts'), 'export const marker = 1;'],
  ]);
  expect(checkSourceGraph(files)).toEqual([expect.stringContaining('BOUNDARY_DYNAMIC_IMPORT')]);
});
