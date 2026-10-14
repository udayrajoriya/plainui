import { readFile, stat, unlink, writeFile } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { sourceTokens } from './source-tokens.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const dist = join(root, 'dist');
const names = ['plainui', 'plainui-router', 'plainui-fragments', 'plainui-ui'];
const issues = [];
const manifest = JSON.parse(await readFile(join(dist, 'build-manifest.json'), 'utf8'));

async function required(file) {
  try {
    const info = await stat(file);
    if (!info.isFile()) issues.push(`build.entries: not a file: ${file}`);
  } catch {
    issues.push(`build.entries: missing: ${file}`);
  }
}

function checkNoEval(file, code) {
  const tokens = sourceTokens(code);
  for (let index = 0; index < tokens.length; index += 1) {
    if (tokens[index].kind === 'identifier' && ['eval', 'Function'].includes(tokens[index].value)) {
      issues.push(`build.no-eval: ${file} contains ${tokens[index].value} execution`);
    }
  }
}

for (const [directory, section] of [[dist, manifest.release], [join(dist, 'dev'), manifest.dev]]) {
  for (const name of names) {
    for (const extension of ['.js', '.mjs']) {
      const file = `${name}${extension}`;
      const output = join(directory, file);
      await required(output);
      await required(`${output}.map`);
      await required(join(directory, `${name}.d.ts`));
      await required(join(directory, `${name}.d.mts`));
      if (!section[file]) {
        issues.push(`build.entries: manifest missing ${file}`);
        continue;
      }
      const code = await readFile(output, 'utf8');
      checkNoEval(output, code);
      if (name !== 'plainui') {
        const inputs = section[file].inputs.map((input) => input.replaceAll('\\', '/'));
        if (inputs.some((input) => input.includes('packages/core/') || input.includes('packages/runtime/'))) {
          issues.push(`build.no-duplicate-core: ${file} includes core/runtime source`);
        }
        if (extension === '.mjs') {
          const bridgeImport = section[file].imports.find((entry) => entry.path === './plainui.mjs' && entry.external);
          if (!bridgeImport || !code.includes('from"./plainui.mjs"') && !code.includes('from "./plainui.mjs"')) {
            issues.push(`build.no-duplicate-core: ${file} lacks the relative public bridge import`);
          }
        }
      }
    }
  }
  const css = join(directory, 'plainui.css');
  await required(css);
  await required(`${css}.map`);
}

for (const name of names) {
  await required(join(dist, `${name}.d.ts`));
}
for (const packageName of ['core', 'data', 'forms', 'components']) {
  for (const entry of ['plainui.js', 'plainui.mjs']) {
    const inputs = manifest.release[entry]?.inputs ?? [];
    if (!inputs.some((input) => input.replaceAll('\\', '/').includes(`packages/${packageName}/`))) {
      issues.push(`build.entries: ${entry} omits ${packageName}`);
    }
  }
}
const releaseCore = await readFile(join(dist, 'plainui.js'), 'utf8');
const developmentCore = await readFile(join(dist, 'dev', 'plainui.js'), 'utf8');
if (releaseCore.includes('PlainUI debug assertion')) {
  issues.push('build.debug: production bundle retains debug assertion');
}
if (!developmentCore.includes('PlainUI debug assertion')) {
  issues.push('build.debug: development bundle lacks debug assertion');
}
if (issues.length) {
  for (const issue of issues) console.error(issue);
  process.exitCode = 1;
} else {
  const typeProbe = join(dist, '.types-smoke.ts');
  await writeFile(typeProbe, [
    "import { PlainUI } from './plainui.mjs';",
    "import { installRouter } from './plainui-router.mjs';",
    "import { installFragments } from './plainui-fragments.mjs';",
    "import { installUI } from './plainui-ui.mjs';",
    'const app = PlainUI.create();',
    'installRouter(app); installFragments(app); installUI(app);',
    '',
  ].join('\n'));
  try {
    const compiler = join(root, 'node_modules', 'typescript', 'bin', 'tsc');
    const check = spawnSync(process.execPath, [compiler, '--ignoreConfig', '--noEmit',
      '--target', 'ES2022', '--module', 'ESNext', '--moduleResolution', 'Bundler',
      '--skipLibCheck', typeProbe], { cwd: root, stdio: 'inherit' });
    if (check.error) throw check.error;
    if (check.status !== 0) throw new Error('build.entries: distribution declaration resolution failed');
  } finally {
    await unlink(typeProbe);
  }
  console.log('Build entries, external bridge imports, core isolation, and no-eval checks passed.');
}
