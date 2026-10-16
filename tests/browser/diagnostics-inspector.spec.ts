import {expect,test} from '@playwright/test';
import {build} from 'esbuild';

async function runtime(){return (await build({entryPoints:['packages/runtime/src/esm.ts'],bundle:true,write:false,format:'iife',globalName:'Runtime',platform:'browser',define:{__PLAINUI_DEBUG__:'true'}})).outputFiles[0]!.text;}

test('inspect.redacted, no-side-effect, frozen, and shared transport counts',async({page})=>{
  let calls=0,release!:()=>void;await page.route('https://example.test/api/items?token=secret',async route=>{calls++;await new Promise<void>(resolve=>{release=resolve;});await route.fulfill({status:503,contentType:'application/json',body:'{"message":"backend secret"}'});});
  await page.setContent('<base href="https://example.test/"><main ui-app="demo" ui-state=\'{"value":1}\'><template ui-data="one" ui-get="/api/items?token=secret" ui-cache="1000"></template><template ui-data="two" ui-get="/api/items?token=secret" ui-cache="1000"></template><span ui-text="observed(value)"></span></main>');await page.addScriptTag({content:await runtime()});
  await page.evaluate(()=>{(globalThis as any).formats=0;const app=(globalThis as any).Runtime.PlainUI.create({debug:true});app.registerFormatter('observed',(value:any)=>{(globalThis as any).formats++;return String(value);});(globalThis as any).app=app.mount(document.querySelector('main'));});
  await expect.poll(()=>calls).toBe(1);await expect.poll(()=>page.evaluate(()=>(globalThis as any).app.inspect().resourceConsumers)).toBe(2);
  const live=await page.evaluate(()=>{const before=(globalThis as any).formats,snapshot=(globalThis as any).app.inspect(),after=(globalThis as any).formats;return {snapshot,before,after,frozen:Object.isFrozen(snapshot)&&Object.isFrozen(snapshot.root)&&Object.isFrozen(snapshot.ownersByKind)&&Object.isFrozen(snapshot.resources)&&snapshot.resources.every((item:any)=>Object.isFrozen(item))};});
  expect(live.before).toBe(live.after);expect(live.frozen).toBe(true);expect(live.snapshot.root).toEqual({id:'demo',status:'mounted'});expect(live.snapshot.sharedTransports).toBe(1);expect(live.snapshot.resourceConsumers).toBe(2);expect(live.snapshot.resources).toHaveLength(2);expect(live.snapshot.bindings).toBe(1);expect(JSON.stringify(live.snapshot)).not.toMatch(/secret|https?:|headers|body|data|message/iu);
  release();await expect.poll(()=>page.evaluate(()=>(globalThis as any).app.inspect().resources.every((item:any)=>item.status==='error'))).toBe(true);
  const failed=await page.evaluate(()=>(globalThis as any).app.inspect());expect(failed.resources.every((item:any)=>JSON.stringify(item.error)==='{"kind":"http","code":null,"status":503}')).toBe(true);expect(JSON.stringify(failed)).not.toContain('backend secret');
  const zero=await page.evaluate(()=>{(globalThis as any).app.unmount();return (globalThis as any).app.inspect();});expect(zero.root.status).toBe('unmounted');expect(zero.owners).toBe(0);expect(zero.listeners).toBe(0);expect(zero.subscribers).toBe(0);expect(zero.timers).toBe(0);expect(zero.pendingActions).toBe(0);expect(zero.cacheEntries).toBe(0);expect(zero.resources).toEqual([]);
});

test('inspect.production rejects while redacted diagnostics remain available',async({page})=>{
  await page.setContent('<base href="https://user:password@example.test/path?token=secret"><main ui-app="prod"><span ui-text="missing"></span></main>');await page.addScriptTag({content:await runtime()});
  const result=await page.evaluate(async()=>{const app=(globalThis as any).Runtime.PlainUI.create(),diagnostics:any[]=[];app.onDiagnostic((item:any)=>diagnostics.push(item));app.mount(document.querySelector('main'));await app.ready;let code='';try{app.inspect();}catch(error){code=(error as any).code;}return {code,diagnostics};});
  expect(result.code).toBe('INSPECTOR_DISABLED');expect(result.diagnostics.some((item:any)=>item.code==='IDENTIFIER_UNKNOWN')).toBe(true);expect(JSON.stringify(result.diagnostics)).not.toMatch(/password|token=secret/iu);
});

test('inspect reports action debounce timers and pending operations until settlement',async({page})=>{
  let release!:()=>void;await page.route('https://example.test/save',async route=>{await new Promise<void>(resolve=>{release=resolve;});await route.fulfill({status:204,body:''});});
  await page.setContent('<base href="https://example.test/"><main ui-app="actions"><button id="save" ui-post="/save" ui-debounce="100">Save</button></main>');await page.addScriptTag({content:await runtime()});
  await page.evaluate(async()=>{const app=(globalThis as any).Runtime.PlainUI.create({debug:true});(globalThis as any).app=app.mount(document.querySelector('main'));await app.ready;});await page.locator('#save').click();
  expect(await page.evaluate(()=>(globalThis as any).app.inspect().timers)).toBeGreaterThanOrEqual(1);await expect.poll(()=>page.evaluate(()=>(globalThis as any).app.inspect().pendingActions)).toBe(1);expect(await page.evaluate(()=>(globalThis as any).app.inspect().listeners)).toBeGreaterThanOrEqual(1);
  release();await expect.poll(()=>page.evaluate(()=>(globalThis as any).app.inspect().pendingActions)).toBe(0);
});
