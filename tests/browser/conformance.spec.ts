import { expect, test } from '@playwright/test';
import { assertNoLeaks, waitForPredicate } from '../support/assertions.js';
import { FixtureClock } from '../support/clock.js';
import type { ConformanceFixture, FixtureOutcome } from '../support/fixture.js';
import { runFixture } from '../support/runner.js';
import { FixtureServer } from '../support/server.js';

test('harness.parity: one fixture has equal classic and ESM outcomes', async ({ page }) => {
  const server=new FixtureServer();await server.start();
  const fixture:ConformanceFixture={id:'harness.parity',rfc:['Design §15'],html:'<div id="result">Ready</div>',modules:['router','fragments','ui'],steps:[],expected:{dom:{'#result':'Ready'},modules:['router','fragments','ui'],requestCount:0},teardown:{}};
  try { const classic=await runFixture(page,server,fixture,'classic'); const esm=await runFixture(page,server,fixture,'esm'); expect(esm).toEqual(classic); }
  finally { await server.close(); }
});
test('harness.race: named barriers release in reverse request order', async ({ page }) => {
  const server=new FixtureServer();await server.start();
  try {
    server.reset([{path:'/a',barrier:'first',body:'"A"'},{path:'/b',barrier:'second',body:'"B"'}]);
    await page.goto(server.origins[0]!);
    await page.evaluate(({origin})=>{(window as typeof window & {results:string[]}).results=[];for(const name of ['a','b'])void fetch(`${origin}/${name}`).then(r=>r.json()).then(v=>(window as typeof window & {results:string[]}).results.push(v));},{origin:server.origins[0]});
    await waitForPredicate(()=>server.pendingBarriers,count=>count===2,1000,'two held responses');
    server.release('second');
    await waitForPredicate(()=>page.evaluate(()=>(window as typeof window & {results:string[]}).results),value=>value.length===1,1000,'second response accepted first');
    server.release('first');
    const results=await waitForPredicate(()=>page.evaluate(()=>(window as typeof window & {results:string[]}).results),value=>value.length===2,1000,'two completed responses');
    expect(results).toEqual(['B','A']);
    expect(server.requests).toHaveLength(2);
    expect(server.origins[0]).not.toBe(server.origins[1]);
  } finally { await page.goto('about:blank');await server.close(); }
});
test('harness.leak: an intentional listener leak fails teardown', () => {
  const outcome:FixtureOutcome={dom:{},state:{},events:[],diagnostics:[],requestCount:0,modules:[],counts:{owners:0,timers:0,listeners:1,subscribers:0}};
  expect(()=>assertNoLeaks(outcome)).toThrow('Fixture leak: listeners expected 0, got 1');
});
test('harness.timeout: missing completion fails with bounded predicate context', async () => {
  await expect(waitForPredicate(()=>false,value=>value,25,'deliberately absent completion')).rejects.toThrow('Timed out after 25 ms waiting for deliberately absent completion');
});
test('fixture clock orders equal-deadline work and drains cancellations', () => {
  const clock=new FixtureClock();const order:string[]=[];
  clock.setTimeout(()=>order.push('first'),5);clock.setTimeout(()=>order.push('second'),5);const canceled=clock.setTimeout(()=>order.push('bad'),1);clock.clearTimeout(canceled);
  clock.advance(5);expect(order).toEqual(['first','second']);expect(clock.pending).toBe(0);
});
