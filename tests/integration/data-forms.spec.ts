import {expect,test} from 'vitest';
import fc from 'fast-check';
import {FlightCoordinator} from '../../packages/data/src/coordinator/flight.js';
import {buildRequestDraft} from '../../packages/data/src/request/draft.js';
import {ResourceCache} from '../../packages/data/src/cache/lru.js';
import {CacheInvalidator} from '../../packages/data/src/cache/invalidate.js';
import {ActionController} from '../../packages/data/src/action/controller.js';

const policy={allowedOrigins:['https://example.test'],document:{querySelectorAll:()=>[]} as unknown as Document,csrf:null};
const draft=(timeoutMs:number,epoch=1)=>buildRequestDraft({method:'GET',url:'https://example.test/api/items',credentials:'same-origin',responseMode:'json',timeoutMs,retry:0,adapter:{name:'identity',version:'1'},epoch,generation:1,signal:new AbortController().signal},policy);
const turn=()=>new Promise<void>(resolve=>setTimeout(resolve,0));

test('500 seeded request schedules accept only current owner, generation, key, epoch and invalidation tokens',async()=>{
  let schedules=0,accepted=0,discarded=0;
  await fc.assert(fc.asyncProperty(fc.integer({min:0,max:255}),fc.integer({min:0,max:255}),async(first,second)=>{
    schedules++;const coordinator=new FlightCoordinator<number|null>(),request=await draft(first&1?100:1000);const starts:{resolve:(value:number|null)=>void}[]=[];
    const states=[0,1].map(()=>({active:true,generation:1,key:'items',epoch:1,invalidationGeneration:0}));const delivered:number[]=[];
    for(let index=0;index<2;index++){const state=states[index]!;coordinator.subscribe('items',request,0,{id:String(index),owner:state,generation:1,key:'items',epoch:1,invalidationGeneration:0,current:()=>({...state}),success:()=>delivered.push(index),failure:()=>{}},()=>new Promise<number|null>(resolve=>starts.push({resolve})));}
    await Promise.resolve();expect(starts).toHaveLength(1);
    for(let index=0;index<2;index++){const selector=(index===0?first:second)%6,state=states[index]!;if(selector===1)state.generation++;if(selector===2)state.key='other';if(selector===3)state.epoch++;if(selector===4)state.invalidationGeneration++;if(selector===5)state.active=false;}
    const expected=states.flatMap((state,index)=>state.active&&state.generation===1&&state.key==='items'&&state.epoch===1&&state.invalidationGeneration===0?[index]:[]);
    starts[0]!.resolve(null);await turn();expect(delivered).toEqual(expected);accepted+=delivered.length;discarded+=2-delivered.length;expect(coordinator.inFlight.size).toBe(0);coordinator.cancelAll();
  }),{seed:20261016,numRuns:500});
  expect(schedules).toBe(500);expect(accepted).toBeGreaterThan(0);expect(discarded).toBeGreaterThan(0);
},20000);

test('cache TTL consumers, null success, eviction and invalidation remain independent',()=>{
  const cache=new ResourceCache(1),invalidator=new CacheInvalidator(cache),adapter={name:'identity',version:'1'};
  cache.put('a',null,100,adapter,1,0);expect(cache.read('a',0,100,1,0)).toBeUndefined();expect(cache.read('a',1000,100,1,0)?.data).toBeNull();
  cache.put('b',1,101,adapter,1,0);expect(cache.peek('a')).toBeUndefined();expect(cache.peek('b')?.data).toBe(1);invalidator.invalidate('b');expect(cache.read('b',1000,102,1,0)).toBeUndefined();
});

test('subscribers with different timeout policies use separate flights',async()=>{
  const coordinator=new FlightCoordinator<number>(),short=await draft(100),long=await draft(1000),owner={active:true};let starts=0;const resolvers:((value:number)=>void)[]=[];const seen:number[]=[];
  const subscribe=(id:string,request:Awaited<ReturnType<typeof draft>>)=>coordinator.subscribe('key',request,0,{id,owner,generation:1,key:'key',epoch:1,invalidationGeneration:0,current:()=>({active:true,generation:1,key:'key',epoch:1,invalidationGeneration:0}),success:value=>seen.push(value),failure:()=>{}},()=>{starts++;return new Promise<number>(resolve=>resolvers.push(resolve));});
  subscribe('short-a',short);subscribe('short-b',short);subscribe('long-a',long);subscribe('long-b',long);await Promise.resolve();expect(starts).toBe(2);expect(coordinator.inFlight.size).toBe(2);resolvers[1]!(2);resolvers[0]!(1);await turn();expect(seen.sort()).toEqual([1,1,2,2]);expect(coordinator.inFlight.size).toBe(0);
});

test('replace cancellation cannot prove a mutation failed on the server',async()=>{
  let serverMutations=0;const pending:((value:number)=>void)[]=[];const action=new ActionController({owner:{active:true},debounceMs:0,concurrency:'replace' as const,start:()=>new Promise<number>(resolve=>pending.push(resolve)),publish:()=>{},pending:()=>()=>{}});
  action.trigger(1);await Promise.resolve();serverMutations++;action.trigger(2);await Promise.resolve();serverMutations++;pending[1]!(2);await turn();pending[0]!(1);await turn();expect(action.record.data).toBe(2);expect(serverMutations).toBe(2);action.dispose();
});
