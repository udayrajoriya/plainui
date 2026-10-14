import type { Page } from '@playwright/test';
import { assertExpected, assertNoLeaks, waitForPredicate } from './assertions.js';
import { FixtureClock } from './clock.js';
import type { BuildMode, ConformanceFixture, FixtureOutcome } from './fixture.js';
import { FixtureServer } from './server.js';

type BrowserHarness = {app?:{ready?:Promise<void>;mount?:(element:Element)=>unknown;set?:(path:string,value:unknown)=>void;get?:(path:string)=>unknown;unmount?:()=>void;inspect?:()=>unknown;installedModules?:readonly string[]}|undefined;events:string[];diagnostics:string[];counts:{owners:number;timers:number;listeners:number;subscribers:number}};
declare global { interface Window { __plainuiHarness?:BrowserHarness; PlainUI?:{create:()=>BrowserHarness['app'];mount?:(element:Element)=>BrowserHarness['app']}; } }
const installation:Record<'router'|'fragments'|'ui',string>={router:'installRouter',fragments:'installFragments',ui:'installUI'};

export async function runFixture(page:Page,server:FixtureServer,fixture:ConformanceFixture,mode:BuildMode):Promise<FixtureOutcome> {
  const clock=new FixtureClock();
  server.reset(fixture.httpScript??[]);
  await page.addInitScript(() => { window.__plainuiHarness={events:[],diagnostics:[],counts:{owners:0,timers:0,listeners:0,subscribers:0}}; });
  try {
    await page.goto(server.origins[0]!);
    await page.evaluate((seed)=>{localStorage.clear();sessionStorage.clear();for(const [key,value] of Object.entries(seed))localStorage.setItem(key,value);history.replaceState(null,'','/');},fixture.storageSeed??{});
    await page.locator('#fixture').evaluate((element,html)=>{element.innerHTML=html;},fixture.html);
    if (mode==='classic') {
      await page.addScriptTag({url:`${server.origins[0]}/dist/plainui.js`});
      for (const module of fixture.modules??[]) await page.addScriptTag({url:`${server.origins[0]}/dist/plainui-${module}.js`});
      await page.evaluate(()=>{window.__plainuiHarness!.app=window.PlainUI!.create();});
    } else {
      await page.evaluate(async ({origin,modules,installation})=>{
        const runtime=await import(/* @vite-ignore */ `${origin}/dist/plainui.mjs`);
        const app=runtime.PlainUI.create();
        for(const module of modules){const exports=await import(/* @vite-ignore */ `${origin}/dist/plainui-${module}.mjs`);exports[installation[module as keyof typeof installation]](app);}
        window.__plainuiHarness!.app=app;
      },{origin:server.origins[0],modules:fixture.modules??[],installation});
    }
    for(const step of fixture.steps) {
      switch(step.op) {
        case 'mount': await page.evaluate(selector=>{const element=document.querySelector(selector);if(!element)throw new Error(`Mount target missing: ${selector}`);window.__plainuiHarness!.app?.mount?.(element);},step.selector); break;
        case 'awaitReady': await waitForPredicate(()=>page.evaluate(async()=>{const ready=window.__plainuiHarness?.app?.ready;if(!ready)return false;await ready;return true;}),value=>value,step.timeoutMs,'app.ready'); break;
        case 'set': await page.evaluate(({path,value})=>{const app=window.__plainuiHarness?.app;if(!app?.set)throw new Error('set unavailable before T017');app.set(path,value);},{path:step.path,value:step.value}); break;
        case 'dispatch': await page.locator(step.selector).dispatchEvent(step.event); break;
        case 'input': await page.locator(step.selector).fill(step.value); break;
        case 'resolve': case 'reject': server.release(step.barrier,{status:step.status??(step.op==='reject'?500:200),...(step.headers?{headers:step.headers}:{}),...(step.body!==undefined?{body:step.body}:{})}); break;
        case 'advanceClock': clock.advance(step.ms); await page.clock.runFor(step.ms); break;
        case 'flush': await waitForPredicate(()=>page.evaluate(()=>window.__plainuiHarness?.counts.timers??0),value=>value===0,step.timeoutMs,'flush idle'); break;
        case 'navigate': await page.goto(new URL(step.path,server.origins[0]).href); break;
        case 'unmount': await page.evaluate(()=>window.__plainuiHarness?.app?.unmount?.()); break;
        case 'inspect': await waitForPredicate(()=>page.evaluate(path=>{let value:unknown=window.__plainuiHarness;for(const key of path.split('.'))value=(value as Record<string,unknown>)?.[key];return value;},step.predicate.path),value=>JSON.stringify(value)===JSON.stringify(step.predicate.equals),step.timeoutMs,`inspect ${step.predicate.path}`); break;
      }
    }
    const outcome:FixtureOutcome=await page.evaluate((expected)=>{
      const harness=window.__plainuiHarness!;
      const dom:Record<string,string|null>={};for(const selector of Object.keys(expected.dom??{}))dom[selector]=document.querySelector(selector)?.textContent??null;
      const state:Record<string,unknown>={};for(const path of Object.keys(expected.state??{}))state[path]=harness.app?.get?.(path);
      return {dom,state,events:[...harness.events],diagnostics:[...harness.diagnostics],modules:[...(harness.app?.installedModules??[])],counts:{...harness.counts}};
    },fixture.expected??{}).then(result=>({...result,requestCount:server.requests.length}));
    assertExpected(outcome,fixture.expected??{});
    if (server.unsentExpected) throw new Error(`Expected ${server.unsentExpected} request(s) were never sent`);
    if (server.pendingBarriers) throw new Error(`Fixture left ${server.pendingBarriers} response barrier(s) unresolved`);
    if (fixture.teardown) assertNoLeaks(outcome,{owners:fixture.teardown.owners??0,timers:fixture.teardown.timers??0,listeners:fixture.teardown.listeners??0,subscribers:fixture.teardown.subscribers??0});
    return outcome;
  } finally {
    clock.clear();
    server.reset();
    await page.goto('about:blank').catch(()=>{});
  }
}
