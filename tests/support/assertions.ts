import type { FixtureOutcome } from './fixture.js';

export async function waitForPredicate<T>(read:()=>Promise<T>|T,predicate:(value:T)=>boolean,timeoutMs:number,label:string):Promise<T> {
  if (!Number.isFinite(timeoutMs) || timeoutMs<=0) throw new Error(`Invalid timeout for ${label}`);
  const deadline=Date.now()+timeoutMs;
  while (true) {
    const value=await read();
    if (predicate(value)) return value;
    if (Date.now()>=deadline) throw new Error(`Timed out after ${timeoutMs} ms waiting for ${label}; last value: ${JSON.stringify(value)}`);
    await new Promise<void>(resolve=>setTimeout(resolve,Math.min(10,Math.max(1,deadline-Date.now()))));
  }
}
export function assertNoLeaks(outcome:FixtureOutcome,expected={owners:0,timers:0,listeners:0,subscribers:0}):void {
  for (const [name,count] of Object.entries(expected)) if (outcome.counts[name as keyof typeof outcome.counts]!==count) throw new Error(`Fixture leak: ${name} expected ${count}, got ${outcome.counts[name as keyof typeof outcome.counts]}`);
}
export function assertExpected(outcome:FixtureOutcome,expected:NonNullable<import('./fixture.js').ConformanceFixture['expected']>):void {
  for (const [selector,text] of Object.entries(expected.dom??{})) if (outcome.dom[selector]!==text) throw new Error(`DOM mismatch at ${selector}`);
  for (const [path,value] of Object.entries(expected.state??{})) if (JSON.stringify(outcome.state[path])!==JSON.stringify(value)) throw new Error(`State mismatch at ${path}`);
  if (expected.requestCount!==undefined && outcome.requestCount!==expected.requestCount) throw new Error(`Unexpected request count: ${outcome.requestCount}`);
  if (expected.events && JSON.stringify(outcome.events)!==JSON.stringify(expected.events)) throw new Error('Event order mismatch');
  if (expected.diagnostics && JSON.stringify(outcome.diagnostics)!==JSON.stringify(expected.diagnostics)) throw new Error('Diagnostic mismatch');
  if (expected.modules && JSON.stringify(outcome.modules)!==JSON.stringify(expected.modules)) throw new Error('Module mismatch');
}
