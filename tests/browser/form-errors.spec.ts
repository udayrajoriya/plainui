import {expect,test} from '@playwright/test';
import {build} from 'esbuild';
import AxeBuilder from '@axe-core/playwright';

async function runtime(){return (await build({entryPoints:['packages/runtime/src/esm.ts'],bundle:true,write:false,format:'iife',globalName:'Runtime',platform:'browser'})).outputFiles[0]!.text;}

test('error.first-message, literal names, external controls and owned ARIA',async({page})=>{
  await page.route('https://example.test/api/save',route=>route.fulfill({status:422,contentType:'application/json',body:'{}'}));
  await page.setContent('<base href="https://example.test/"><main ui-app="one"><input form="f" id="external" name="person.name" aria-describedby="hint" aria-invalid="false"><span id="hint">Hint</span><form id="f" method="post" action="/api/save" ui-post="/api/save" ui-action="save" ui-adapter="server"><span id="error" ui-field-error="person.name"></span><button id="go">Go</button></form></main>');await page.addScriptTag({content:await runtime()});
  await page.evaluate(async()=>{const app=(window as any).Runtime.PlainUI.create();app.registerAdapter('server',{version:'1',error:(error:any)=>({...error,fields:{'person.name':['First','Second'],unmatched:['Global']}})});(window as any).app=app.mount(document.querySelector('main'));await app.ready;});
  await page.locator('#go').click();await expect(page.locator('#error')).toHaveText('First');const state=await page.evaluate(()=>({id:document.querySelector('#error')!.id,described:document.querySelector('#external')!.getAttribute('aria-describedby'),invalid:document.querySelector('#external')!.getAttribute('aria-invalid'),fields:(window as any).app.get('save').error.fields}));expect(state.described).toBe(`hint ${state.id}`);expect(state.invalid).toBe('true');expect(state.fields['person.name']).toEqual(['First','Second']);expect(state.fields.unmatched).toEqual(['Global']);
  await page.locator('#external').fill('edited');await expect(page.locator('#error')).toBeEmpty();expect(await page.locator('#external').getAttribute('aria-describedby')).toBe('hint');expect(await page.locator('#external').getAttribute('aria-invalid')).toBe('false');expect(await page.evaluate(()=>(window as any).app.get('save').error.fields)).toEqual({unmatched:['Global']});
});

test('error.new-submit-clear and reset clear field associations',async({page})=>{
  let calls=0;await page.route('https://example.test/api/save',route=>{calls++;return route.fulfill({status:422,contentType:'application/json',body:'{}'});});
  await page.setContent('<base href="https://example.test/"><main ui-app="one"><form id="f" method="post" action="/api/save" ui-post="/api/save" ui-action="save" ui-adapter="server"><input id="name" name="name"><span id="error" ui-field-error="name"></span><button id="go">Go</button><button id="reset" type="reset">Reset</button></form></main>');await page.addScriptTag({content:await runtime()});await page.evaluate(async()=>{const app=(window as any).Runtime.PlainUI.create();app.registerAdapter('server',{version:'1',error:(error:any)=>({...error,fields:{name:['Bad']}})});(window as any).app=app.mount(document.querySelector('main'));await app.ready;});
  await page.locator('#go').click();await expect(page.locator('#error')).toHaveText('Bad');await page.locator('#reset').click();await expect(page.locator('#error')).toBeEmpty();expect(await page.evaluate(()=>(window as any).app.get('save').error.fields)).toEqual({});
  await page.locator('#go').click();await expect(page.locator('#error')).toHaveText('Bad');expect(calls).toBe(2);
});

test('error.outside-form is diagnosed',async({page})=>{
  await page.setContent('<base href="https://example.test/"><main ui-app="one"><span ui-field-error="name"></span></main>');await page.addScriptTag({content:await runtime()});expect(await page.evaluate(async()=>{const app=(window as any).Runtime.PlainUI.create();const codes:string[]=[];app.onDiagnostic((item:any)=>codes.push(item.code));app.mount(document.querySelector('main'));await app.ready;return codes;})).toContain('FORM_INVALID');
});

test('error.cleanup-owned-only preserves author changes after presentation',async({page})=>{
  await page.route('https://example.test/api/save',route=>route.fulfill({status:422,contentType:'application/json',body:'{}'}));
  await page.setContent('<base href="https://example.test/"><main ui-app="one"><form method="post" action="/api/save" ui-post="/api/save" ui-adapter="server"><input id="name" name="name" aria-describedby="hint"><span id="hint">Hint</span><span id="error" ui-field-error="name"></span><button id="go">Go</button></form></main>');await page.addScriptTag({content:await runtime()});await page.evaluate(async()=>{const app=(window as any).Runtime.PlainUI.create();app.registerAdapter('server',{version:'1',error:(error:any)=>({...error,fields:{name:['Bad']}})});(window as any).app=app.mount(document.querySelector('main'));await app.ready;});
  await page.locator('#go').click();await expect(page.locator('#error')).toHaveText('Bad');await page.evaluate(()=>{const input=document.querySelector('#name')!;input.setAttribute('aria-describedby',`${input.getAttribute('aria-describedby')} author`);input.setAttribute('aria-invalid','false');document.querySelector('#error')!.textContent='Author message';});await page.locator('#name').fill('fixed');expect(await page.locator('#name').getAttribute('aria-describedby')).toBe('hint author');expect(await page.locator('#name').getAttribute('aria-invalid')).toBe('false');await expect(page.locator('#error')).toHaveText('Author message');
});

test('error associations pass an axe form audit',async({page})=>{
  await page.route('https://example.test/api/save',route=>route.fulfill({status:422,contentType:'application/json',body:'{}'}));
  await page.setContent('<base href="https://example.test/"><main ui-app="one"><form id="f" method="post" action="/api/save" ui-post="/api/save" ui-adapter="server"><label for="name">Name</label><input id="name" name="name"><p id="error" ui-field-error="name" role="alert"></p><button id="go">Save</button></form></main>');await page.addScriptTag({content:await runtime()});await page.evaluate(async()=>{const app=(window as any).Runtime.PlainUI.create();app.registerAdapter('server',{version:'1',error:(error:any)=>({...error,fields:{name:['Invalid name']}})});(window as any).app=app.mount(document.querySelector('main'));await app.ready;});await page.locator('#go').click();await expect(page.locator('#error')).toHaveText('Invalid name');const report=await new AxeBuilder({page}).include('#f').analyze();expect(report.violations).toEqual([]);
});
