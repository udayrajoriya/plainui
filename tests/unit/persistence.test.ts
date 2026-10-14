import {expect,test} from 'vitest';
import {PersistenceBinding} from '../../packages/core/src/state/persistence.js';
import {Scheduler} from '../../packages/core/src/scheduler/flush.js';
import {createCell} from '../../packages/core/src/state/cell.js';

function memory(){const entries=new Map<string,string>();let writes=0;const storage={getItem:(key:string)=>entries.get(key)??null,setItem:(key:string,value:string)=>{writes++;entries.set(key,value);},removeItem:(key:string)=>entries.delete(key),clear:()=>entries.clear(),key:(index:number)=>[...entries.keys()][index]??null,get length(){return entries.size;}} as Storage;return {storage,entries,get writes(){return writes;}};}
const settle=()=>new Promise<void>(resolve=>setTimeout(resolve,0));
test('persist.local-session, coalescing, collision and reset session',async()=>{
  const local=memory(),session=memory(),errors:unknown[]=[];const scheduler=new Scheduler(error=>errors.push(error));const owner={active:true};const cell=createCell('state',{count:1});const options={rootName:'app x',version:2,key:'count one',kind:'local' as const,cell,defaults:{count:1},owner,localStorage:local.storage,sessionStorage:session.storage};
  const binding=new PersistenceBinding(options,scheduler,error=>errors.push(error));expect(binding.storageKey).toBe('plainui:app%20x:v2:count%20one');expect(()=>new PersistenceBinding(options,scheduler,()=>{})).toThrow();
  cell.value={count:2};binding.changed();cell.value={count:3};binding.changed();await settle();expect(local.writes).toBe(1);expect(session.writes).toBe(0);expect(JSON.parse(local.entries.get(binding.storageKey)!)).toEqual({version:2,value:{count:3}});
  binding.dispose();const restored=new PersistenceBinding({...options,cell:createCell('state',{count:1})},scheduler,error=>errors.push(error));restored.restore();expect(restored['options'].cell.value).toEqual({count:3});restored.dispose();expect(errors).toEqual([]);
});
test('persist.version, corrupt envelope and quota leave defaults/live value',async()=>{
  const local=memory(),session=memory(),errors:any[]=[];const scheduler=new Scheduler(error=>errors.push(error));const owner={active:true};const cell=createCell('state',{a:1});const options={rootName:'versions',version:1,key:'x',kind:'local' as const,cell,defaults:{a:1},owner,localStorage:local.storage,sessionStorage:session.storage};
  const binding=new PersistenceBinding(options,scheduler,error=>errors.push(error));local.entries.set(binding.storageKey,JSON.stringify({version:2,value:{a:4}}));binding.restore();expect(cell.value).toEqual({a:1});expect(errors.at(-1).code).toBe('PERSISTENCE_INVALID');
  local.entries.set(binding.storageKey,JSON.stringify({version:1,value:{a:3,extra:1}}));binding.restore();expect(cell.value).toEqual({a:1});
  const denied={...local.storage,setItem:()=>{throw new Error('quota');}} as Storage;binding.dispose();const failing=new PersistenceBinding({...options,localStorage:denied},scheduler,error=>errors.push(error));cell.value={a:5};failing.changed();await settle();expect(cell.value).toEqual({a:5});expect(errors.at(-1).code).toBe('PERSISTENCE_STORAGE');failing.dispose();
});
