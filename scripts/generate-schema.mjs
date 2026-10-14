import { build } from 'esbuild';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { join, resolve } from 'node:path';

const root = resolve(import.meta.dirname,'..');
const bundle = await build({entryPoints:[join(root,'packages/schema/src/index.ts')],bundle:true,platform:'node',format:'esm',write:false});
const schema = await import(`data:text/javascript;base64,${Buffer.from(bundle.outputFiles[0].contents).toString('base64')}`);
const rows = schema.DIRECTIVES.map(({name,kind,placement,module:owner,default:defaultValue,values,min,max,requires,conflicts}) => ({name,alias:name.replace(/^ui-/,'data-ui-'),kind,placement,module:owner,...(defaultValue === undefined ? {} : {default:defaultValue}),...(values ? {values} : {}),...(min === undefined ? {} : {min}),...(max === undefined ? {} : {max}),...(requires ? {requires} : {}),...(conflicts ? {conflicts} : {})}));
const metadata = {schemaVersion:schema.SCHEMA_FORMAT_VERSION,grammarVersion:schema.GRAMMAR_VERSION,directives:rows,diagnostics:schema.DIAGNOSTICS,configuration:schema.CONFIG_SCHEMA,props:schema.PROP_DEFINITION_SCHEMA,behaviors:{tabs:schema.TABS_SCHEMA,toasts:schema.TOAST_SCHEMA},allowlists:{bindings:[...schema.BIND_ATTRIBUTES].sort(),fragmentTags:[...schema.FRAGMENT_TAGS].sort(),fragmentAttributes:[...schema.FRAGMENT_ATTRIBUTES].sort(),enhanced:[...schema.ENHANCED_DIRECTIVES].sort(),enhancedFamilies:[...schema.ENHANCED_FAMILIES].sort()}};
const coverageSource = await readFile(join(root,'specs/implementation/07-coverage.md'),'utf8');
const coverageRows = [...coverageSource.matchAll(/^\| (ui-[^|]+) \| (T[0-9][^|]+) \|/gm)].map(([,name,tasks]) => ({name:name.trim(),tasks:tasks.trim()}));
const tasksFor = (name) => {
  const found = coverageRows.find(row => row.name.split(/ and |, /).map(part => part.replace('-NAME','-*').replace(':EVENT',':*')).includes(name));
  if (!found) throw new Error(`No implementation tasks for ${name}`);
  return found.tasks;
};
const coverage = {schemaVersion:schema.SCHEMA_FORMAT_VERSION,grammarVersion:schema.GRAMMAR_VERSION,rows:rows.map(row => ({name:row.name,tasks:tasksFor(row.name),spellings:[row.name,row.alias],coverage:Object.fromEntries([row.name,row.alias].map(spelling => [spelling,{valid:`schema.valid.${spelling}`,invalid:`schema.invalid.${spelling}`,lifecycle:`lifecycle.${spelling}`}]))}))};
const reference = ['# Directive reference','','Generated from `packages/schema/src`. Do not edit directly.','','| Directive | Alias | Value | Placement | Module | Default |','|---|---|---|---|---|---|',...rows.map(row => `| \`${row.name}\` | \`${row.alias}\` | ${row.kind} | ${row.placement} | ${row.module} | ${row.default === undefined ? '—' : `\`${JSON.stringify(row.default)}\``} |`),''].join('\n');
const outputs = [[join(root,'packages/schema/generated/schema.json'),JSON.stringify(metadata,null,2)+'\n'],[join(root,'tests/fixtures/schema.json'),JSON.stringify(coverage,null,2)+'\n'],[join(root,'docs/generated/directives-reference.md'),reference]];
const check = process.argv.includes('--check');
for (const [path,content] of outputs) {
  if (check) { const existing = await readFile(path,'utf8').catch(() => ''); if (existing !== content) throw new Error(`Generated file differs: ${path}`); }
  else { await mkdir(resolve(path,'..'),{recursive:true}); await writeFile(path,content); }
}
const source = await readFile(join(root,'specs/implementation/09-schema-details.md'),'utf8');
const section = source.split('## Registry source rows')[1]?.split('## Exact binding allowlist')[0] ?? '';
const sourceRows = [...section.matchAll(/^\| (ui-[^|]+) \|/gm)].map(match => match[1].trim());
if (sourceRows.length !== 55) throw new Error(`Expected 55 source rows, got ${sourceRows.length}`);
const expected = new Set();
for (const row of sourceRows) {
  const names = row === 'ui-src and ui-href' ? ['ui-src','ui-href'] : row === 'ui-if and ui-else-if' ? ['ui-if','ui-else-if'] : row.includes(', ') ? row.split(', ') : [row];
  for (const name of names) {
    const normalized = name.replace('-NAME','-*').replace(':EVENT',':*');
    expected.add(normalized);
    if (!rows.some(entry => entry.name === normalized)) throw new Error(`Missing source row: ${name}`);
  }
}
if (new Set(rows.map(row => row.name)).size !== rows.length) throw new Error('Duplicate directive definition');
for (const row of rows) if (!expected.has(row.name)) throw new Error(`Unexpected directive definition: ${row.name}`);
for (const row of coverage.rows) for (const spelling of row.spellings) for (const category of ['valid','invalid','lifecycle']) if (!row.coverage[spelling][category]) throw new Error(`Missing coverage ID: ${spelling}/${category}`);
console.log(`Schema ${check ? 'checked' : 'generated'}: ${sourceRows.length} source rows, ${rows.length} directive entries`);
