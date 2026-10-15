import {expect,test} from '@playwright/test';
import {build} from 'esbuild';

async function runtime(){return (await build({entryPoints:['packages/runtime/src/esm.ts'],bundle:true,write:false,format:'iife',globalName:'Runtime',platform:'browser'})).outputFiles[0]!.text;}
const base='<base href="https://example.test/">';

test('model.checkbox-boolean and array rejection',async({page})=>{
  await page.setContent(`${base}<main ui-app="one" ui-state='{"yes":true,"bad":[]}'><input id="yes" type="checkbox" ui-model="yes"><input id="bad" type="checkbox" ui-model="bad"></main>`);
  await page.addScriptTag({content:await runtime()});
  await page.evaluate(async()=>{const app=(window as any).Runtime.PlainUI.create();(window as any).errors=[];app.onDiagnostic((item:any)=>(window as any).errors.push(item.code));(window as any).app=app.mount(document.querySelector('main'));await app.ready;});
  await expect(page.locator('#yes')).toBeChecked();await page.locator('#yes').uncheck();expect(await page.evaluate(()=>(window as any).app.get('yes'))).toBe(false);
  expect(await page.evaluate(()=>(window as any).errors)).toContain('FORM_INVALID');
});

test('model.radio-string synchronizes group and diagnoses conflicting paths',async({page})=>{
  await page.setContent(`${base}<main ui-app="one" ui-state='{"choice":"b","other":"a"}'><form><input id="a" type="radio" name="r" value="a" ui-model="choice"><input id="b" type="radio" name="r" value="b" ui-model="choice"><input id="bad" type="radio" name="r" value="c" ui-model="other"></form></main>`);
  await page.addScriptTag({content:await runtime()});await page.evaluate(async()=>{const app=(window as any).Runtime.PlainUI.create();(window as any).errors=[];app.onDiagnostic((item:any)=>(window as any).errors.push(item.code));(window as any).app=app.mount(document.querySelector('main'));await app.ready;});
  await expect(page.locator('#b')).toBeChecked();expect(await page.evaluate(()=>(window as any).errors)).toContain('FORM_INVALID');
  await page.locator('#a').check();expect(await page.evaluate(()=>(window as any).app.get('choice'))).toBe('a');
  await page.evaluate(()=>(window as any).app.set('choice','unmatched'));await expect(page.locator('#a')).not.toBeChecked();await expect(page.locator('#b')).not.toBeChecked();
});

test('model.select respects DOM order, no match, and dynamic options',async({page})=>{
  await page.setContent(`${base}<main ui-app="one" ui-state='{"one":"missing","many":["b","a"]}'><select id="one" ui-model="one"><option value="a">A</option></select><select id="many" ui-model="many" multiple><option value="a">A</option><option value="b">B</option><option value="c">C</option></select></main>`);
  await page.addScriptTag({content:await runtime()});await page.evaluate(async()=>{(window as any).app=(window as any).Runtime.PlainUI.mount(document.querySelector('main'));await (window as any).app.ready;});
  expect(await page.locator('#one').evaluate((node:HTMLSelectElement)=>node.selectedIndex)).toBe(-1);
  await page.evaluate(()=>{document.querySelector('#one')!.insertAdjacentHTML('beforeend','<option value="missing">M</option>');});
  await expect(page.locator('#one')).toHaveValue('missing');
  await page.locator('#many').selectOption(['c','a']);expect(await page.evaluate(()=>(window as any).app.get('many'))).toEqual(['a','c']);
  await page.locator('#many').selectOption([]);expect(await page.evaluate(()=>(window as any).app.get('many'))).toEqual([]);
});

test('model.cleanup-group releases removed radio registrations',async({page})=>{
  await page.setContent(`${base}<main ui-app="one" ui-state='{"a":"x","b":"y"}'><form id="f"><input id="old" type="radio" name="r" value="x" ui-model="a"></form></main>`);
  await page.addScriptTag({content:await runtime()});await page.evaluate(async()=>{const app=(window as any).Runtime.PlainUI.create();(window as any).errors=[];app.onDiagnostic((item:any)=>(window as any).errors.push(item.code));(window as any).app=app.mount(document.querySelector('main'));await app.ready;});
  await page.locator('#old').evaluate(element=>element.remove());
  await expect.poll(()=>page.evaluate(()=>document.querySelector('#old'))).toBeNull();
  await page.evaluate(()=>document.querySelector('#f')!.insertAdjacentHTML('beforeend','<input id="new" type="radio" name="r" value="y" ui-model="b">'));
  await expect(page.locator('#new')).toBeChecked();expect(await page.evaluate(()=>(window as any).errors)).not.toContain('FORM_INVALID');
});
