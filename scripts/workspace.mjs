import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(import.meta.url);
const task = process.argv[2];
const deferred = {
  'test:security': 'T090',
  'validate:examples': 'T087',
  'check:size': 'T094',
  bench: 'T094',
  'check:release': 'T097',
};

function packageBin(name, key) {
  const manifest = require.resolve(`${name}/package.json`);
  const { bin } = JSON.parse(readFileSync(manifest, 'utf8'));
  const relative = typeof bin === 'string' ? bin : bin[key];
  if (!relative) throw new Error(`Missing ${key} executable in ${name}`);
  return join(dirname(manifest), relative);
}

function runNode(file, args = []) {
  const child = spawnSync(process.execPath, [file, ...args], {
    cwd: root,
    stdio: 'inherit',
    env: process.env,
  });
  if (child.error) throw child.error;
  process.exitCode = child.status ?? 1;
}

if (task in deferred) {
  console.error(`${task} is registered but its implementation is scheduled for ${deferred[task]}.`);
  process.exitCode = 1;
} else if (task === 'typecheck') {
  runNode(packageBin('typescript', 'tsc'), ['--project', 'tsconfig.json']);
} else if (task === 'test:unit') {
  runNode(packageBin('vitest', 'vitest'), ['run', 'tests/unit']);
} else if (task === 'test:browser') {
  runNode(join(root, 'scripts', 'smoke-build.mjs'));
  if (process.exitCode === 0) {
    runNode(join(root, 'scripts', 'build.mjs'));
  }
  if (process.exitCode === 0) {
    runNode(join(root, 'scripts', 'build-sanitizer-spike.mjs'));
  }
  if (process.exitCode === 0) {
    runNode(packageBin('@playwright/test', 'playwright'), ['test', 'tests/browser']);
  }
} else if (task === 'test:conformance') {
  runNode(join(root, 'scripts', 'build.mjs'));
  if (process.exitCode === 0) runNode(packageBin('@playwright/test', 'playwright'), ['test', 'tests/browser/conformance.spec.ts']);
} else if (task === 'build') {
  runNode(join(root, 'scripts', 'check-boundaries.mjs'));
  if (process.exitCode === 0) runNode(join(root, 'scripts', 'build.mjs'));
  if (process.exitCode === 0) runNode(join(root, 'scripts', 'check-build.mjs'));
} else if (task === 'check:boundaries') {
  runNode(join(root, 'scripts', 'check-boundaries.mjs'));
} else if (task === 'check:generated') {
  runNode(join(root, 'scripts', 'generate-schema.mjs'), ['--check']);
  if (process.exitCode === 0) runNode(join(root, 'scripts', 'generate-reference.mjs'), ['--check']);
} else {
  console.error(`Unknown workspace task: ${task ?? '(missing)'}`);
  process.exitCode = 1;
}
