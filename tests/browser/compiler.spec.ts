import {expect,test} from '@playwright/test';
import {build} from 'esbuild';
test('compile normalizes aliases, ignores descendants, captures templates and keeps local errors',async({page})=>{
  const code=(await build({entryPoints:['packages/core/src/compiler/walk.ts'],bundle:true,write:false,format:'iife',globalName:'Compiler',platform:'browser'})).outputFiles[0]!.text;
  await page.setContent('<main ui-app="demo"><div id="good" data-ui-text="x"></div><div id="bad" ui-unknown="x"></div><div id="ignored" ui-ignore><span ui-unknown="x"></span></div><template id="branch" ui-if="x"><strong ui-text="x"></strong></template></main>');await page.addScriptTag({content:code});
  const result=await page.evaluate(()=>{const result=(window as any).Compiler.compileTree(document.querySelector('main'));return {plans:result.plans.map((p:any)=>p.element.id||p.element.localName),issues:result.issues.map((i:any)=>[i.code,i.element.id]),template:result.plans.find((p:any)=>p.element.id==='branch')?.template?.querySelector('strong')?.getAttribute('ui-text'),fatal:result.fatal};});
  expect(result.plans).toContain('good');expect(result.plans).not.toContain('bad');expect(result.issues).toEqual([['UNKNOWN_DIRECTIVE','bad']]);expect(result.plans).toContain('ignored');expect(result.template).toBe('x');expect(result.fatal).toBe(false);
});
test('compile rejects duplicate aliases, invalid flags and structural placement',async({page})=>{
  const code=(await build({entryPoints:['packages/core/src/compiler/walk.ts'],bundle:true,write:false,format:'iife',globalName:'Compiler',platform:'browser'})).outputFiles[0]!.text;
  await page.setContent('<main ui-app="demo"><div id="duplicate" ui-text="a" data-ui-text="b"></div><span id="flag" ui-cloak="yes"></span><div id="placed" ui-if="x"></div></main>');await page.addScriptTag({content:code});
  const issues=await page.evaluate(()=>(window as any).Compiler.compileTree(document.querySelector('main')).issues.map((i:any)=>[i.code,i.element.id]));
  expect(issues).toContainEqual(['DIRECTIVE_CONFLICT','duplicate']);expect(issues).toContainEqual(['DIRECTIVE_VALUE','flag']);expect(issues).toContainEqual(['DIRECTIVE_VALUE','placed']);
});
