import {expect,test} from 'vitest';
import {Scheduler} from '../../packages/core/src/scheduler/flush.js';
import {DerivedGraph} from '../../packages/core/src/state/derived.js';
import {createCell} from '../../packages/core/src/state/cell.js';

const settle=()=>new Promise<void>(resolve=>setTimeout(resolve,0));
test('scheduler.phase-order, sync batch, cancellation and disposal',async()=>{
  const errors:unknown[]=[];const scheduler=new Scheduler(error=>errors.push(error));const owner={active:true};const order:string[]=[];
  scheduler.enqueue('bindings',{owner,run:()=>order.push('bindings')});scheduler.enqueue('derived',{owner,run:()=>order.push('derived')});
  scheduler.enqueue('structure',{owner,run:()=>order.push('structure')});scheduler.enqueue('accessibility',{owner,run:()=>order.push('accessibility')});
  scheduler.afterFlush(owner,()=>order.push('after'));const cancel=scheduler.afterFlush(owner,()=>order.push('cancelled'));cancel();
  await settle();expect(order).toEqual(['derived','structure','bindings','accessibility','after']);expect(errors).toEqual([]);
  scheduler.enqueue('bindings',{owner,run:()=>order.push('dead')});owner.active=false;await settle();expect(order).not.toContain('dead');scheduler.dispose();
});
test('scheduler.limit-100 and other-root independence',async()=>{
  const errors:any[]=[];const first=new Scheduler(error=>errors.push(error));const second=new Scheduler(error=>errors.push(error));let loops=0;let other=false;
  const job={run:()=>{loops++;first.enqueue('bindings',job);}};first.enqueue('bindings',job);second.enqueue('bindings',{run:()=>{other=true;}});await settle();
  expect(loops).toBe(100);expect(other).toBe(true);expect(errors.filter(error=>error.code==='UPDATE_LOOP')).toHaveLength(1);
});
test('derived.multi-hop, cycle-partial and limit preservation',()=>{
  const errors:any[]=[];const graph=new DerivedGraph(error=>errors.push(error));const a=createCell('derived',0);const b=createCell('derived',0);const c=createCell('derived',4);
  graph.define('a',a,[],()=>({ok:true,value:2}));graph.define('b',b,['a'],()=>({ok:true,value:(a.value as number)+1}));graph.define('c',c,[],()=>({ok:false,code:'EXPRESSION_LIMIT'}));graph.evaluateAll();
  expect([a.value,b.value,c.value]).toEqual([2,3,4]);expect(errors.at(-1).code).toBe('EXPRESSION_LIMIT');
  graph.define('a',a,['b'],()=>({ok:true,value:9}));graph.evaluateAll();expect([a.value,b.value]).toEqual([2,3]);expect(errors.some(error=>error.code==='DERIVED_CYCLE')).toBe(true);
});
