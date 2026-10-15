import { readdir, readFile } from 'node:fs/promises';
import { dirname, extname, isAbsolute, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildSync } from 'esbuild';
import { sourceTokens } from './source-tokens.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const packagesRoot = join(root, 'packages');
const optional = new Set(['router', 'fragments', 'ui']);
const allowed = new Map([
  ['schema', new Set()],
  ['core', new Set(['schema'])],
  ['data', new Set(['schema', 'core'])],
  ['forms', new Set(['schema', 'core'])],
  ['components', new Set(['schema', 'core'])],
  ['runtime', new Set(['core', 'data', 'forms', 'components'])],
  ['router', new Set(['schema'])],
  ['fragments', new Set(['schema'])],
  ['ui', new Set(['schema'])],
  ['styles', new Set()],
  ['tooling', new Set(['schema'])],
]);

function slash(path) {
  return path.split(sep).join('/');
}

function packageName(path) {
  const within = relative(packagesRoot, path);
  if (within.startsWith('..') || isAbsolute(within)) return null;
  return within.split(sep)[0] ?? null;
}

function resolveSource(from, specifier, files) {
  if (specifier === '@plainui/runtime-bridge') {
    return join(packagesRoot, 'core', 'src', 'module-bridge.ts');
  }
  if (!specifier.startsWith('.')) return null;
  const target = resolve(dirname(from), specifier);
  const withoutExtension = target.replace(/\.(?:js|mjs|cjs)$/u, '');
  const candidates = [target, `${withoutExtension}.ts`, `${withoutExtension}.mts`,
    join(withoutExtension, 'index.ts'), join(withoutExtension, 'index.mts')];
  return candidates.find((candidate) => files.has(candidate)) ?? undefined;
}

function inspectImport(source, specifier, files, edges, issues) {
  const sourcePackage = packageName(source);
  if (!sourcePackage || !allowed.has(sourcePackage)) return;
  const location = slash(relative(root, source));
  if (specifier === 'dompurify' && sourcePackage !== 'fragments') {
    issues.push(`BOUNDARY_IMPORT ${location}: DOMPurify is only allowed in fragments`);
    return;
  }
  if (specifier === '@plainui/runtime-bridge' && !optional.has(sourcePackage)) {
    issues.push(`BOUNDARY_IMPORT ${location}: runtime bridge is only for optional modules`);
    return;
  }
  const target = resolveSource(source, specifier, files);
  if (target === null) {
    const externalAllowed = (sourcePackage === 'fragments' && specifier === 'dompurify')
      || (sourcePackage === 'data' && specifier === '@noble/hashes/sha2.js')
      || (sourcePackage === 'tooling' && (specifier === 'parse5' || specifier.startsWith('node:')));
    if (!externalAllowed) issues.push(`BOUNDARY_EXTERNAL ${location}: ${specifier}`);
    return;
  }
  if (target === undefined || !files.has(target)) {
    issues.push(`BOUNDARY_UNRESOLVED ${location}: ${specifier}`);
    return;
  }
  const targetPackage = packageName(target);
  if (!targetPackage || !allowed.has(targetPackage)) {
    issues.push(`BOUNDARY_IMPORT ${location}: ${specifier} leaves packages/`);
    return;
  }
  if (sourcePackage !== targetPackage) {
    let permitted = allowed.get(sourcePackage)?.has(targetPackage) ?? false;
    if (sourcePackage === 'forms' && targetPackage === 'data') {
      permitted = target === join(packagesRoot, 'data', 'src', 'action-service.ts');
    }
    if (['data', 'forms', 'components'].includes(sourcePackage) && targetPackage === 'core') {
      permitted = [
        join(packagesRoot, 'core', 'src', 'integration.ts'),
        join(packagesRoot, 'core', 'src', 'index.ts'),
      ].includes(target);
    }
    if (optional.has(sourcePackage) && targetPackage === 'core') {
      permitted = target === join(packagesRoot, 'core', 'src', 'module-bridge.ts');
    }
    if (!permitted) {
      issues.push(`BOUNDARY_IMPORT ${location}: ${specifier} crosses ${sourcePackage} -> ${targetPackage}`);
    }
  }
  edges.get(source)?.add(target);
}

export function checkSourceGraph(files) {
  const issues = [];
  const edges = new Map([...files.keys()].map((path) => [path, new Set()]));
  for (const [path, text] of files) {
    try {
      const parse = buildSync({
        stdin: { contents: text, sourcefile: path, loader: 'ts' },
        bundle: false,
        write: false,
        metafile: true,
        logLevel: 'silent',
      });
      const runtimeImports = Object.values(parse.metafile.outputs)[0]?.imports ?? [];
      for (const entry of runtimeImports) {
        if (entry.kind === 'dynamic-import' || entry.kind === 'require-call') {
          issues.push(`BOUNDARY_DYNAMIC_IMPORT ${slash(relative(root, path))}: dynamic import/require is forbidden`);
        }
      }
    } catch (error) {
      issues.push(`BOUNDARY_PARSE ${slash(relative(root, path))}: ${error.message}`);
      continue;
    }
    let tokens;
    try {
      tokens = sourceTokens(text);
    } catch (error) {
      issues.push(`BOUNDARY_PARSE ${slash(relative(root, path))}: ${error.message}`);
      continue;
    }
    for (let index = 0; index < tokens.length; index += 1) {
      const token = tokens[index];
      const following = tokens[index + 1];
      if (token.value !== 'import' && token.value !== 'export') continue;
      if (token.value === 'import' && following?.kind === 'string') {
        inspectImport(path, following.value, files, edges, issues);
        continue;
      }
      if (token.value === 'export' && !['*', '{', 'type'].includes(following?.value)) continue;
      for (let cursor = index + 1; cursor < tokens.length; cursor += 1) {
        const part = tokens[cursor];
        if (part.value === ';') break;
        if (part.value === '=' && token.value === 'import') {
          issues.push(`BOUNDARY_IMPORT ${slash(relative(root, path))}: import-equals is forbidden`);
          break;
        }
        if (part.value === 'from' && tokens[cursor + 1]?.kind === 'string') {
          inspectImport(path, tokens[cursor + 1].value, files, edges, issues);
          break;
        }
      }
    }
  }

  const active = new Set();
  const complete = new Set();
  const stack = [];
  function walk(path) {
    if (active.has(path)) {
      const start = stack.indexOf(path);
      issues.push(`BOUNDARY_CYCLE ${stack.slice(start).concat(path).map((item) => slash(relative(root, item))).join(' -> ')}`);
      return;
    }
    if (complete.has(path)) return;
    active.add(path);
    stack.push(path);
    for (const next of edges.get(path) ?? []) walk(next);
    stack.pop();
    active.delete(path);
    complete.add(path);
  }
  for (const path of files.keys()) walk(path);
  return issues.sort();
}

export async function loadPackageSources(directory = packagesRoot) {
  const files = new Map();
  async function walk(path) {
    for (const entry of await readdir(path, { withFileTypes: true })) {
      const child = join(path, entry.name);
      if (entry.isDirectory()) await walk(child);
      else if (entry.isFile() && ['.ts', '.mts'].includes(extname(child)) && !child.endsWith('.d.ts')) {
        files.set(child, await readFile(child, 'utf8'));
      }
    }
  }
  await walk(directory);
  return files;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const files = await loadPackageSources();
  const issues = checkSourceGraph(files);
  if (issues.length) {
    for (const issue of issues) console.error(issue);
    process.exitCode = 1;
  } else {
    console.log(`Package boundaries and cycles checked across ${files.size} source files.`);
  }
}
