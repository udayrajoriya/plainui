import {DOM_EVENTS,EVENT_MODIFIERS,LIFECYCLE_EVENTS} from '../../../schema/src/allowlists.js';
import {PlainUIError} from '../diagnostics/codes.js';
import {EvaluationBudget} from '../expression/evaluate.js';
import type {Owner,OwnerTree} from '../ownership/owner.js';
import type {CompiledCommand} from './parse.js';
import {snapshotEvent,type EventSnapshot} from './snapshot.js';

export interface EventDescriptor {readonly event:string;readonly prevent:boolean;readonly stop:boolean;readonly once:boolean;readonly self:boolean;readonly lifecycle:boolean}
export function parseEventDirective(name:string,requestTrigger:string|boolean=false):EventDescriptor {const canonical=name.startsWith('data-ui-')?name.slice(5):name;if(!canonical.startsWith('ui-on:'))throw new PlainUIError('DIRECTIVE_VALUE');const [event,...modifiers]=canonical.slice(6).split('.');const trigger=requestTrigger===true?'submit':requestTrigger;if(!event||!DOM_EVENTS.has(event)&&!LIFECYCLE_EVENTS.has(event)||modifiers.some(item=>!EVENT_MODIFIERS.has(item))||new Set(modifiers).size!==modifiers.length||LIFECYCLE_EVENTS.has(event)&&modifiers.length||Boolean(trigger)&&event===trigger)throw new PlainUIError('DIRECTIVE_VALUE');return {event,prevent:modifiers.includes('prevent'),stop:modifiers.includes('stop'),once:modifiers.includes('once'),self:modifiers.includes('self'),lifecycle:LIFECYCLE_EVENTS.has(event)};}
export function attachEventHandler(tree:OwnerTree,owner:Owner,host:Element,descriptor:EventDescriptor,commands:readonly CompiledCommand[],execute:(commands:readonly CompiledCommand[],snapshot:EventSnapshot,budget:EvaluationBudget)=>Promise<void>,onError:(error:unknown)=>void):()=>void {
  tree.assertActive(owner);let active=true;const listener=(event:Event)=>{if(!active||!owner.active)return;if(descriptor.self&&event.target!==host)return;
    if(descriptor.prevent)event.preventDefault();if(descriptor.stop)event.stopPropagation();if(descriptor.once){active=false;host.removeEventListener(descriptor.event,listener);}
    let snapshot:EventSnapshot;try{snapshot=snapshotEvent(event);}catch(error){onError(error);return;}
    try{void execute(commands,snapshot,new EvaluationBudget()).catch(onError);}catch(error){onError(error);}
  };
  host.addEventListener(descriptor.event,listener,{signal:owner.signal});const release=()=>{if(!active)return;active=false;host.removeEventListener(descriptor.event,listener);};tree.registerDisposer(owner,release);return release;
}
