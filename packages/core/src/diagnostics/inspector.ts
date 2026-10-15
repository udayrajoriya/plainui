import { PlainUIError } from './codes.js';
export type CounterName='owners'|'timers'|'listeners'|'subscribers'|'pendingActions'|'cacheEntries'|'jobs';
export type InspectorSnapshot=Readonly<Record<CounterName,number>>;
export class Inspector {
  private counts:Record<CounterName,number>={owners:0,timers:0,listeners:0,subscribers:0,pendingActions:0,cacheEntries:0,jobs:0};
  constructor(private readonly debug:boolean) {}
  allocate(name:CounterName):()=>void { this.counts[name]++;let active=true;return()=>{if(active){active=false;this.counts[name]--;}}; }
  count(name:CounterName):number { return this.counts[name]; }
  snapshot():InspectorSnapshot { if(!this.debug)throw new PlainUIError('INSPECTOR_DISABLED');return Object.freeze({...this.counts}); }
  zero():boolean { return Object.values(this.counts).every(count=>count===0); }
}
