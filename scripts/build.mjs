import { spawnSync } from 'node:child_process';
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { build } from 'esbuild';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const dist = join(root, 'dist');
const modules = ['router', 'fragments', 'ui'];
const entries = [
  { name: 'plainui', classic: 'packages/runtime/src/classic.ts', esm: 'packages/runtime/src/esm.ts' },
  ...modules.map((name) => ({
    name: `plainui-${name}`,
    classic: `packages/${name}/src/entry-classic.ts`,
    esm: `packages/${name}/src/entry-esm.ts`,
  })),
];

function slash(path) {
  return path.split(sep).join('/');
}

function bridgeImportPlugin() {
  return {
    name: 'plainui-official-bridge',
    setup(pluginBuild) {
      pluginBuild.onResolve({ filter: /^@plainui\/runtime-bridge$/ }, () => ({
        path: './plainui.mjs',
        external: true,
      }));
    },
  };
}

async function buildVariant(directory, debug) {
  await mkdir(directory, { recursive: true });
  const results = {};
  for (const entry of entries) {
    for (const [kind, source, extension, format] of [
      ['classic', entry.classic, '.js', 'iife'],
      ['esm', entry.esm, '.mjs', 'esm'],
    ]) {
      const file = join(directory, `${entry.name}${extension}`);
      const result = await build({
        entryPoints: [join(root, source)],
        outfile: file,
        bundle: true,
        format,
        platform: 'browser',
        target: 'es2022',
        minify: !debug,
        sourcemap: 'external',
        metafile: true,
        logLevel: 'silent',
        define: { __PLAINUI_DEBUG__: String(debug) },
        plugins: kind === 'esm' && entry.name !== 'plainui' ? [bridgeImportPlugin()] : [],
      });
      const output = result.metafile.outputs[slash(relative(root, file))];
      if (!output) throw new Error(`Missing esbuild metadata for ${file}`);
      results[`${entry.name}${extension}`] = {
        bytes: output.bytes,
        inputs: Object.keys(output.inputs).sort(),
        imports: output.imports.map(({ path, external }) => ({ path, external: Boolean(external) })),
      };
    }
  }

  const cssFile = join(directory, 'plainui.css');
  const css = await build({
    entryPoints: [join(root, 'packages/styles/src/plainui.css')],
    outfile: cssFile,
    bundle: true,
    minify: !debug,
    sourcemap: 'external',
    metafile: true,
    logLevel: 'silent',
  });
  const cssOutput = css.metafile.outputs[slash(relative(root, cssFile))];
  if (!cssOutput) throw new Error(`Missing esbuild metadata for ${cssFile}`);
  results['plainui.css'] = {
    bytes: cssOutput.bytes,
    inputs: Object.keys(cssOutput.inputs).sort(),
    imports: [],
  };
  return results;
}

const release = await buildVariant(dist, false);
const development = await buildVariant(join(dist, 'dev'), true);

const tsc = join(root, 'node_modules', 'typescript', 'bin', 'tsc');
const declarations = spawnSync(process.execPath, [tsc, '--project', 'tsconfig.build.json'], {
  cwd: root,
  stdio: 'inherit',
});
if (declarations.error) throw declarations.error;
if (declarations.status !== 0) throw new Error('TypeScript declaration build failed');

const declarationsByEntry = {
  'plainui.d.ts': "export { PlainUI, getModuleBridge } from './types/packages/runtime/src/esm.js';\nexport type { AppScaffold, OfficialModuleBridge } from './types/packages/runtime/src/esm.js';\n",
  ...Object.fromEntries(modules.map((name) => [
    `plainui-${name}.d.ts`,
    `export { install${name === 'ui' ? 'UI' : name[0].toUpperCase() + name.slice(1)} } from './types/packages/${name}/src/entry-esm.js';\n`,
  ])),
};
for (const [file, content] of Object.entries(declarationsByEntry)) {
  await writeFile(join(dist, file), content);
  await writeFile(join(dist, 'dev', file), content.replaceAll('./types/', '../types/'));
  const moduleFile = file.replace(/\.d\.ts$/u, '.d.mts');
  await writeFile(join(dist, moduleFile), content);
  await writeFile(join(dist, 'dev', moduleFile), content.replaceAll('./types/', '../types/'));
}

await writeFile(join(dist, 'build-manifest.json'), `${JSON.stringify({
  schemaVersion: 1,
  development: false,
  release,
  dev: development,
}, null, 2)}\n`);

console.log(`Built ${Object.keys(release).length} production and ${Object.keys(development).length} development entries.`);
