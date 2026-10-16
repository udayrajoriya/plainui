import {detachedSnapshot,type JsonValue} from '../../core/src/index.js';
import type {ModelMount} from '../../core/src/integration.js';

interface Captured {readonly mount:ModelMount;readonly value:JsonValue}
interface FormSnapshot {readonly paths:Map<string,Captured>;readonly members:Set<ModelMount>;readonly listener:(event:Event)=>void;readonly timers:Set<ReturnType<typeof setTimeout>>}
const snapshots=new WeakMap<HTMLFormElement,FormSnapshot>();
function ancestor(a:string,b:string):boolean {return b===a||b.startsWith(`${a}.`)||b.startsWith(`${a}[`);}

export function registerResetModel(form:HTMLFormElement,mount:ModelMount):()=>void {
  let snapshot=snapshots.get(form);
  if(!snapshot){const paths=new Map<string,Captured>(),members=new Set<ModelMount>(),timers=new Set<ReturnType<typeof setTimeout>>();const listener=(event:Event)=>{const timer=setTimeout(()=>{timers.delete(timer);if(event.defaultPrevented)return;const current=snapshots.get(form);if(!current)return;for(const {mount:target,value} of current.paths.values())if(target.owner.active)target.write(detachedSnapshot(value) as JsonValue);},0);timers.add(timer);};snapshot={paths,members,listener,timers};snapshots.set(form,snapshot);form.addEventListener('reset',listener);}
  snapshot.members.add(mount);
  if(![...snapshot.paths.keys()].some(path=>ancestor(path,mount.path))){for(const path of snapshot.paths.keys())if(ancestor(mount.path,path))snapshot.paths.delete(path);snapshot.paths.set(mount.path,{mount,value:detachedSnapshot(mount.read()) as JsonValue});}
  return ()=>{const current=snapshots.get(form);if(!current)return;current.members.delete(mount);const captured=current.paths.get(mount.path);if(captured?.mount===mount){const replacement=[...current.members].find(other=>other.path===mount.path);if(replacement)current.paths.set(mount.path,{mount:replacement,value:captured.value});else current.paths.delete(mount.path);}if(current.members.size===0){form.removeEventListener('reset',current.listener);for(const timer of current.timers)clearTimeout(timer);snapshots.delete(form);}};
}
