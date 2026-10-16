import { PlainUIError } from './codes.js';
export type CounterName='owners'|'timers'|'listeners'|'subscribers'|'pendingActions'|'cacheEntries'|'jobs';
export const OWNER_KINDS=['root','element','state','conditional','loop','loop-item','component','slot','route','fragment','behavior'] as const;
export type InspectorOwnerKind=typeof OWNER_KINDS[number];
export type InspectorLifecycle='created'|'compiling'|'mounted'|'unmounting'|'unmounted'|'failed';
export interface InspectorResourceError {readonly kind:string;readonly code:string|null;readonly status:number|null}
export interface InspectorResource {readonly id:string;readonly status:'idle'|'loading'|'success'|'error';readonly loading:boolean;readonly refreshing:boolean;readonly stale:boolean;readonly updatedAt:number|null;readonly error:InspectorResourceError|null}
export interface InspectorSnapshot extends Readonly<Record<CounterName,number>> {
  readonly root:Readonly<{id:string;status:InspectorLifecycle}>;
  readonly ownersByKind:Readonly<Record<InspectorOwnerKind,number>>;
  readonly bindings:number;
  readonly sharedTransports:number;
  readonly resourceConsumers:number;
  readonly fragmentRanges:number;
  readonly rangeConsumers:number;
  readonly resources:readonly InspectorResource[];
}
export function freezeInspectorSnapshot(snapshot:InspectorSnapshot):InspectorSnapshot {for(const resource of snapshot.resources){if(resource.error)Object.freeze(resource.error);Object.freeze(resource);}Object.freeze(snapshot.resources);Object.freeze(snapshot.ownersByKind);Object.freeze(snapshot.root);return Object.freeze(snapshot);}
export class Inspector {
  private counts:Record<CounterName,number>={owners:0,timers:0,listeners:0,subscribers:0,pendingActions:0,cacheEntries:0,jobs:0};
  constructor(private readonly debug:boolean) {}
  allocate(name:CounterName):()=>void { this.counts[name]++;let active=true;return()=>{if(active){active=false;this.counts[name]--;}}; }
  count(name:CounterName):number { return this.counts[name]; }
  snapshot():InspectorSnapshot { if(!this.debug)throw new PlainUIError('INSPECTOR_DISABLED');return freezeInspectorSnapshot({...this.counts,root:{id:'',status:'created'},ownersByKind:Object.fromEntries(OWNER_KINDS.map(kind=>[kind,0])) as Record<InspectorOwnerKind,number>,bindings:0,sharedTransports:0,resourceConsumers:0,fragmentRanges:0,rangeConsumers:0,resources:[]}); }
  zero():boolean { return Object.values(this.counts).every(count=>count===0); }
}
