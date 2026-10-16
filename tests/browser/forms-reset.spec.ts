import {expect,test} from '@playwright/test';
import {build} from 'esbuild';

async function mount(page:import('@playwright/test').Page){const code=(await build({entryPoints:['packages/runtime/src/esm.ts'],bundle:true,write:false,format:'iife',globalName:'Runtime',platform:'browser'})).outputFiles[0]!.text;await page.addScriptTag({content:code});await page.evaluate(async()=>{(window as any).app=(window as any).Runtime.PlainUI.mount(document.querySelector('main'));await (window as any).app.ready;});}
const base='<base href="https://example.test/">';

test('reset.only-bound-paths and radio-once restore initial models',async({page})=>{
  await page.setContent(`${base}<main ui-app="one" ui-state='{"name":"initial","choice":"b","outside":"old"}'><form id="f" ui-ref="formRef"><input id="name" name="name" ui-model="name"><input id="a" type="radio" name="choice" value="a" ui-model="choice"><input id="b" type="radio" name="choice" value="b" ui-model="choice"><button type="reset" id="native">Reset</button></form><button id="command" ui-on:click="reset('formRef')">Command</button></main>`);await mount(page);
  await page.locator('#name').fill('changed');await page.locator('#a').check();await page.evaluate(()=>(window as any).app.set('outside','new'));
  await page.locator('#native').click();await expect.poll(()=>page.evaluate(()=>(window as any).app.get('name'))).toBe('initial');await expect(page.locator('#b')).toBeChecked();expect(await page.evaluate(()=>(window as any).app.get('outside'))).toBe('new');
  await page.locator('#name').fill('again');await page.locator('#command').click();await expect.poll(()=>page.evaluate(()=>(window as any).app.get('name'))).toBe('initial');
});

test('reset.canceled preserves models and native file reset remains browser-owned',async({page})=>{
  await page.setContent(`${base}<main ui-app="one" ui-state='{"name":"initial"}'><form id="f"><input id="name" ui-model="name"><input id="file" type="file"><button id="reset" type="reset">Reset</button></form></main>`);await mount(page);
  await page.locator('#name').fill('changed');await page.locator('#file').setInputFiles({name:'x.txt',mimeType:'text/plain',buffer:Buffer.from('x')});
  await page.evaluate(()=>{(window as any).cancel=(event:Event)=>event.preventDefault();document.querySelector('#f')!.addEventListener('reset',(window as any).cancel);});await page.locator('#reset').click();expect(await page.evaluate(()=>(window as any).app.get('name'))).toBe('changed');expect(await page.locator('#file').inputValue()).toContain('x.txt');
  await page.evaluate(()=>document.querySelector('#f')!.removeEventListener('reset',(window as any).cancel));await page.locator('#reset').click();await expect.poll(()=>page.evaluate(()=>(window as any).app.get('name'))).toBe('initial');expect(await page.locator('#file').inputValue()).toBe('');
});

test('reset.remount captures fresh defaults',async({page})=>{
  await page.setContent(`${base}<main ui-app="one" ui-state='{"name":"first"}'><form id="f"><input id="name" ui-model="name"><button type="reset">Reset</button></form></main>`);await mount(page);
  await page.evaluate(()=>{(window as any).app.unmount();document.querySelector('main')!.setAttribute('ui-state','{"name":"second"}');});await page.evaluate(async()=>{(window as any).app=(window as any).Runtime.PlainUI.mount(document.querySelector('main'));await (window as any).app.ready;});
  await page.locator('#name').fill('changed');await page.locator('button').click();await expect.poll(()=>page.evaluate(()=>(window as any).app.get('name'))).toBe('second');
});
