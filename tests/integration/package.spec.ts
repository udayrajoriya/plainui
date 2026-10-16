import {execFileSync,spawnSync} from 'node:child_process';
import {readFile,rm,mkdir,writeFile} from 'node:fs/promises';
import {join,resolve} from 'node:path';
import {describe,expect,test} from 'vitest';

const root=resolve(import.meta.dirname,'../..');
const packageRoot=join(root,'.tools','package');
const runtime=join(packageRoot,'plainui');
const consumer=join(packageRoot,'consumer');
const npmCli=process.env.npm_execpath!;

describe('T079 distributable packages',()=>{
  test('exports only public entry points and records complete integrity metadata',async()=>{
    const manifest=JSON.parse(await readFile(join(runtime,'package.json'),'utf8'));
    expect(Object.keys(manifest.exports)).toEqual(['.','./router','./fragments','./ui','./styles.css','./schema','./plainui.js','./plainui-router.js','./plainui-fragments.js','./plainui-ui.js','./integrity-manifest.json','./package.json']);
    expect(JSON.stringify(manifest.exports)).not.toContain('internal');
    const integrity=JSON.parse(await readFile(join(runtime,'integrity-manifest.json'),'utf8'));
    expect(integrity.package).toEqual({name:'plainui',version:'1.0.0'});
    expect(integrity.toolchain).toMatchObject({node:expect.stringMatching(/^v/u),esbuild:expect.any(String),typescript:expect.any(String)});
    expect(Object.keys(integrity.assets)).toContain('schema.json');
    for(const [file,item] of Object.entries(integrity.assets) as [string,any][]){
      expect(item.bytes, file).toBeGreaterThan(0);
      expect(item.gzipBytes, file).toBeGreaterThan(0);
      expect(item.sha256, file).toMatch(/^sha256-[A-Za-z0-9+/]+=*$/u);
      expect(item.sha384, file).toMatch(/^sha384-[A-Za-z0-9+/]+=*$/u);
    }
    for(const file of ['plainui.js','plainui.mjs','plainui-router.js','plainui-router.mjs','plainui-fragments.js','plainui-fragments.mjs','plainui-ui.js','plainui-ui.mjs','plainui.css']){
      const source=await readFile(join(runtime,file),'utf8');
      expect(source, file).toContain(`sourceMappingURL=${file}.map`);
    }
  });

  test('local tarballs install into a fresh offline consumer with ESM, types, CLI, and classic assets',async()=>{
    await rm(consumer,{recursive:true,force:true});await mkdir(consumer,{recursive:true});
    await writeFile(join(consumer,'package.json'),'{"name":"plainui-package-consumer","private":true,"type":"module"}\n');
    const runtimeTarball=join(packageRoot,'tarballs','plainui-1.0.0.tgz');
    const cliTarball=join(packageRoot,'tarballs','plainui-cli-1.0.0.tgz');
    execFileSync(process.execPath,[npmCli,'install','--ignore-scripts','--offline','--no-audit','--no-fund',runtimeTarball,cliTarball],{cwd:consumer,stdio:'pipe'});
    await writeFile(join(consumer,'smoke.mjs'),`import {PlainUI} from 'plainui';import {installRouter} from 'plainui/router';import {installFragments} from 'plainui/fragments';import {installUI} from 'plainui/ui';import schema from 'plainui/schema' with {type:'json'};const app=installUI(installFragments(installRouter(PlainUI.create())));if(app.status!=='created'||schema.schemaVersion!==1)process.exit(1);console.log(app.installedModules.join(','));\n`);
    expect(execFileSync(process.execPath,['smoke.mjs'],{cwd:consumer,encoding:'utf8'}).trim()).toBe('router,fragments,ui');
    await writeFile(join(consumer,'smoke.ts'),`import {PlainUI,type PlainUIApp} from 'plainui';import {installRouter} from 'plainui/router';const app:PlainUIApp=installRouter(PlainUI.create());void app;\n`);
    await writeFile(join(consumer,'tsconfig.json'),'{"compilerOptions":{"noEmit":true,"strict":true,"target":"ES2022","module":"ESNext","moduleResolution":"Bundler","lib":["ES2022","DOM"]},"include":["smoke.ts"]}\n');
    const tsc=join(root,'node_modules','typescript','bin','tsc');
    const typed=spawnSync(process.execPath,[tsc,'--project','tsconfig.json'],{cwd:consumer,encoding:'utf8'});
    expect(typed.stderr+typed.stdout).toBe('');expect(typed.status).toBe(0);
    const cli=join(consumer,'node_modules','@plainui','cli','plainui-cli.mjs');
    expect(execFileSync(process.execPath,[cli,'--version'],{cwd:consumer,encoding:'utf8'}).trim()).toBe('1.0.0');
    for(const file of ['plainui.js','plainui-router.js','plainui-fragments.js','plainui-ui.js'])expect(await readFile(join(consumer,'node_modules','plainui',file),'utf8')).toContain(`sourceMappingURL=${file}.map`);
  },30_000);
});
