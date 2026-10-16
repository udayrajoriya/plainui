import {spawnSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {cp,mkdir,readFile,rm,writeFile} from 'node:fs/promises';
import {gzipSync} from 'node:zlib';
import {basename,dirname,join,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';

const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const output=join(root,'.tools','package');
const runtimeStage=join(output,'plainui');
const cliStage=join(output,'plainui-cli');
const tarballs=join(output,'tarballs');
const runtimeManifest=JSON.parse(await readFile(join(root,'packages/runtime/package.json'),'utf8'));
const cliManifest=JSON.parse(await readFile(join(root,'packages/tooling/package.json'),'utf8'));
const notice=`PlainUI bundled dependency notices\n\nDOMPurify 3.4.16 — Apache-2.0 or MPL-2.0 — https://github.com/cure53/DOMPurify\n@noble/hashes 2.4.0 — MIT — https://github.com/paulmillr/noble-hashes\nparse5 8.0.1 — MIT — https://github.com/inikulin/parse5\n`;

function run(command,args){const result=spawnSync(command,args,{cwd:root,stdio:'inherit'});if(result.error)throw result.error;if(result.status!==0)throw new Error(`${command} ${args.join(' ')} failed`);}
function digest(algorithm,bytes){return `${algorithm}-${createHash(algorithm).update(bytes).digest('base64')}`;}
async function copy(from,to){await mkdir(dirname(to),{recursive:true});await cp(from,to,{recursive:true});}

if(!process.argv.includes('--skip-build'))run(process.execPath,[join(root,'scripts','build.mjs')]);
await rm(output,{recursive:true,force:true});
await Promise.all([mkdir(runtimeStage,{recursive:true}),mkdir(cliStage,{recursive:true}),mkdir(tarballs,{recursive:true})]);

const runtimeFiles=['plainui.js','plainui.js.map','plainui.mjs','plainui.mjs.map','plainui.d.ts','plainui.d.mts','plainui.css','plainui.css.map',...['router','fragments','ui'].flatMap(name=>[`plainui-${name}.js`,`plainui-${name}.js.map`,`plainui-${name}.mjs`,`plainui-${name}.mjs.map`,`plainui-${name}.d.ts`,`plainui-${name}.d.mts`])];
for(const file of runtimeFiles)await copy(join(root,'dist',file),join(runtimeStage,file));
await copy(join(root,'dist','types'),join(runtimeStage,'types'));
await copy(join(root,'packages/schema/generated/schema.json'),join(runtimeStage,'schema.json'));
await writeFile(join(runtimeStage,'package.json'),`${JSON.stringify(runtimeManifest,null,2)}\n`);
await writeFile(join(runtimeStage,'THIRD_PARTY_NOTICES.txt'),notice);

const integrityFiles=[...runtimeFiles,'schema.json','THIRD_PARTY_NOTICES.txt'];
const assets={};
for(const file of integrityFiles){const bytes=await readFile(join(runtimeStage,file));assets[file]={bytes:bytes.length,gzipBytes:gzipSync(bytes,{level:9}).length,sha256:digest('sha256',bytes),sha384:digest('sha384',bytes)};}
const dependencyVersion=async name=>JSON.parse(await readFile(join(root,'node_modules',name,'package.json'),'utf8')).version;
const integrity={schemaVersion:1,package:{name:runtimeManifest.name,version:runtimeManifest.version},toolchain:{node:process.version,esbuild:await dependencyVersion('esbuild'),typescript:await dependencyVersion('typescript')},assets};
await writeFile(join(runtimeStage,'integrity-manifest.json'),`${JSON.stringify(integrity,null,2)}\n`);

await copy(join(root,'dist','plainui-cli.mjs'),join(cliStage,'plainui-cli.mjs'));
await copy(join(root,'dist','plainui-cli.mjs.map'),join(cliStage,'plainui-cli.mjs.map'));
await writeFile(join(cliStage,'package.json'),`${JSON.stringify(cliManifest,null,2)}\n`);
await writeFile(join(cliStage,'THIRD_PARTY_NOTICES.txt'),notice);

const npmCli=process.env.npm_execpath;
if(!npmCli)throw new Error('package.mjs must be launched through npm so its local npm CLI is known.');
run(process.execPath,[npmCli,'pack',runtimeStage,'--pack-destination',tarballs,'--quiet']);
run(process.execPath,[npmCli,'pack',cliStage,'--pack-destination',tarballs,'--quiet']);
const result={runtime:{stage:runtimeStage,tarball:join(tarballs,`plainui-${runtimeManifest.version}.tgz`)},cli:{stage:cliStage,tarball:join(tarballs,`plainui-cli-${cliManifest.version}.tgz`)}};
await writeFile(join(output,'package-result.json'),`${JSON.stringify(result,null,2)}\n`);
console.log(`Packaged ${basename(result.runtime.tarball)} and ${basename(result.cli.tarball)}.`);
