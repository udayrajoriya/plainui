import {expect,test} from '@playwright/test';
import {build} from 'esbuild';

async function runtime(){return (await build({entryPoints:['packages/runtime/src/esm.ts'],bundle:true,write:false,format:'iife',globalName:'Runtime',platform:'browser'})).outputFiles[0]!.text;}
async function mount(page:import('@playwright/test').Page){await page.addScriptTag({content:await runtime()});await page.evaluate(async()=>{(window as any).app=(window as any).Runtime.PlainUI.mount(document.querySelector('main'));await (window as any).app.ready;});}
const base='<base href="https://example.test/">';

test('a11y.busy-count keeps a shared resource region busy until both requests settle',async({page})=>{
  let releaseA!:()=>void,releaseB!:()=>void;await page.route('https://example.test/api/a',async route=>{await new Promise<void>(resolve=>{releaseA=resolve;});await route.fulfill({status:200,contentType:'application/json',body:'1'});});await page.route('https://example.test/api/b',async route=>{await new Promise<void>(resolve=>{releaseB=resolve;});await route.fulfill({status:200,contentType:'application/json',body:'2'});});
  await page.setContent(`${base}<main ui-app="one"><section id="region" aria-busy="false"><template ui-data="a" ui-get="/api/a"></template><template ui-data="b" ui-get="/api/b"></template></section></main>`);await mount(page);await expect(page.locator('#region')).toHaveAttribute('aria-busy','true');await expect.poll(()=>typeof releaseA).toBe('function');await expect.poll(()=>typeof releaseB).toBe('function');releaseA();await expect.poll(()=>page.evaluate(()=>(window as any).app.get('a').status)).toBe('success');await expect(page.locator('#region')).toHaveAttribute('aria-busy','true');releaseB();await expect.poll(()=>page.evaluate(()=>(window as any).app.get('b').status)).toBe('success');await expect(page.locator('#region')).toHaveAttribute('aria-busy','false');
});

test('form.external-submit-disabled and success-no-reset preserve modeled values',async({page})=>{
  let release!:()=>void;await page.route('https://example.test/api/save',async route=>{await new Promise<void>(resolve=>{release=resolve;});await route.fulfill({status:200,contentType:'application/json',body:'1'});});
  await page.setContent(`${base}<main ui-app="one" ui-state='{"name":"initial"}'><form id="f" method="post" action="/api/save" ui-post="/api/save" ui-action="save" aria-busy="false"><input id="name" name="name" ui-model="name"></form><button id="go" form="f" type="submit">Go</button></main>`);await mount(page);await page.locator('#name').fill('edited');await page.locator('#go').click();await expect.poll(()=>typeof release).toBe('function');await expect(page.locator('#go')).toBeDisabled();await expect(page.locator('#f')).toHaveAttribute('aria-busy','true');release();await expect.poll(()=>page.evaluate(()=>(window as any).app.get('save').status)).toBe('success');await expect(page.locator('#go')).toBeEnabled();await expect(page.locator('#f')).toHaveAttribute('aria-busy','false');expect(await page.evaluate(()=>(window as any).app.get('name'))).toBe('edited');
});

test('form.failure-preserves file and model; explicit success reset restores only on command',async({page})=>{
  let calls=0;await page.route('https://example.test/api/save',route=>{calls++;return route.fulfill({status:calls===1?422:200,contentType:'application/json',body:'1'});});
  await page.setContent(`${base}<main ui-app="one" ui-state='{"name":"initial"}'><form id="f" ui-ref="f" method="post" action="/api/save" ui-post="/api/save" ui-action="save" ui-encoding="multipart" ui-on:success="reset('f')"><input id="name" name="name" ui-model="name"><input id="file" type="file" name="file"><button id="go">Go</button></form></main>`);await mount(page);
  await page.locator('#name').fill('edited');await page.locator('#file').setInputFiles({name:'x.txt',mimeType:'text/plain',buffer:Buffer.from('x')});await page.locator('#go').click();await expect.poll(()=>page.evaluate(()=>(window as any).app.get('save').status)).toBe('error');expect(await page.evaluate(()=>(window as any).app.get('name'))).toBe('edited');expect(await page.locator('#file').inputValue()).toContain('x.txt');await page.locator('#go').click();await expect.poll(()=>page.evaluate(()=>(window as any).app.get('name'))).toBe('initial');expect(await page.locator('#file').inputValue()).toBe('');
});
