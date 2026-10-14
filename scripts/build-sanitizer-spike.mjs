import { build } from 'esbuild';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { gzipSync } from 'node:zlib';
import { join, resolve } from 'node:path';
const root=resolve(import.meta.dirname,'..');
const output=join(root,'experiments/sanitizer/dist');await mkdir(output,{recursive:true});
for(const [name,entry,globalName] of [['sanitizer','experiments/sanitizer/sanitize.ts','SanitizerSpike'],['template','packages/core/src/html/inert.ts','TemplateSpike']])await build({entryPoints:[join(root,entry)],outfile:join(output,`${name}.js`),bundle:true,format:'iife',globalName,platform:'browser',target:'es2022',minify:true,sourcemap:'external',logLevel:'silent'});
const files=['dist/plainui.js','dist/plainui-router.js','dist/plainui-ui.js','experiments/sanitizer/dist/sanitizer.js','experiments/sanitizer/dist/template.js'];
const measurements={};for(const file of files){const bytes=await readFile(join(root,file));measurements[file]={raw:bytes.length,gzip:gzipSync(bytes,{level:9,mtime:0}).length};}
const total=Object.values(measurements).reduce((sum,value)=>({raw:sum.raw+value.raw,gzip:sum.gzip+value.gzip}),{raw:0,gzip:0});
const evidence={node:process.version,compressor:'node:zlib gzipSync level=9 mtime=0',scaffoldCore:measurements['dist/plainui.js'],optionalSanitizer:measurements['experiments/sanitizer/dist/sanitizer.js'],combinedFiles:measurements,combined:total,coreBudgetGzip:35840,combinedBudgetGzip:71680,remainingCoreGzip:35840-measurements['dist/plainui.js'].gzip,remainingCombinedGzip:71680-total.gzip,qualification:'feasibility scaffold only; not final release size'};
await writeFile(join(root,'evidence/size-baseline.json'),JSON.stringify(evidence,null,2)+'\n');console.log(`Sanitizer spike: core ${evidence.scaffoldCore.gzip} gzip; combined ${total.gzip} gzip`);
