import type {FinalRequestDraft} from '../request/draft.js';
import {flightKey} from './key.js';
import {subscriberIsCurrent,type FlightSubscriber} from './subscriber.js';

interface Flight<T> {readonly controller:AbortController;readonly subscribers:Map<string,FlightSubscriber<T>>}
export interface FlightSubscription {readonly cancel:()=>void}
/** One coordinator belongs to exactly one app root. Its settled flights are never retained. */
export class FlightCoordinator<T> {
  readonly inFlight=new Map<string,Flight<T>>();
  subscribe(key:string,draft:FinalRequestDraft,invalidationGeneration:number,subscriber:FlightSubscriber<T>,start:(signal:AbortSignal)=>Promise<T>,onAccepted?:(value:T)=>void,targetId=''):FlightSubscription {
    if(subscriber.key!==key||subscriber.invalidationGeneration!==invalidationGeneration||subscriber.epoch!==draft.metadata.epoch||subscriber.generation!==draft.metadata.generation)throw new Error('Subscriber identity does not match request.');
    const shared=draft.metadata.method==='GET';const identity=flightKey(key,draft,invalidationGeneration,targetId);
    let flight=shared?this.inFlight.get(identity):undefined;
    if(!flight){flight={controller:new AbortController(),subscribers:new Map()};if(shared)this.inFlight.set(identity,flight);const created=flight;
      // Start in a microtask so the first subscriber is installed before a synchronous failure.
      void Promise.resolve().then(()=>created.subscribers.size?start(created.controller.signal):Promise.reject(new DOMException('Operation canceled.','AbortError'))).then(value=>{
        if(shared&&this.inFlight.get(identity)===created)this.inFlight.delete(identity);
        const live=[...created.subscribers.values()].filter(subscriberIsCurrent);
        if(live.length){try{onAccepted?.(value);}catch{/* Subscriber notifications remain independent. */}}
        for(const item of live){try{item.success(value);}catch{/* A callback cannot suppress peers. */}}
        created.subscribers.clear();
      },error=>{
        if(shared&&this.inFlight.get(identity)===created)this.inFlight.delete(identity);
        for(const item of created.subscribers.values()){if(subscriberIsCurrent(item)){try{item.failure(error);}catch{/* A callback cannot suppress peers. */}}}
        created.subscribers.clear();
      });
    }
    if(flight.subscribers.has(subscriber.id))throw new Error('Duplicate subscriber ID.');
    flight.subscribers.set(subscriber.id,subscriber);
    return {cancel:()=>{if(!flight?.subscribers.delete(subscriber.id))return;if(flight.subscribers.size===0){if(shared&&this.inFlight.get(identity)===flight)this.inFlight.delete(identity);flight.controller.abort();}}};
  }
  cancelAll():void {for(const flight of this.inFlight.values()){flight.subscribers.clear();flight.controller.abort();}this.inFlight.clear();}
}
