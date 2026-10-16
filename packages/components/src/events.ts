import {DOM_EVENTS,LIFECYCLE_EVENTS} from '../../schema/src/allowlists.js';
import {PlainUIError,type JsonValue} from '../../core/src/index.js';

const customName=/^[a-z][a-z0-9-]*$/u;
const reserved=new Set([...DOM_EVENTS,...LIFECYCLE_EVENTS,'mount','unmount','beforematch']);

export function validateCustomEventName(name:string):string {if(!customName.test(name)||reserved.has(name))throw new PlainUIError('DIRECTIVE_VALUE');return name;}
export function isCustomEventDirective(name:string):boolean {const canonical=name.startsWith('data-ui-')?name.slice(5):name;if(!canonical.startsWith('ui-on:'))return false;const event=canonical.slice(6);try{validateCustomEventName(event);return true;}catch{return false;}}
export function emitComponentEvent(host:Element,name:string,detail:JsonValue):boolean {validateCustomEventName(name);return host.dispatchEvent(new CustomEvent(name,{detail,bubbles:true,composed:true}));}

export function bindComponentEvent(host:Element,directive:string,listener:(event:CustomEvent<JsonValue>)=>void,signal?:AbortSignal):()=>void {const canonical=directive.startsWith('data-ui-')?directive.slice(5):directive;if(!canonical.startsWith('ui-on:'))throw new PlainUIError('DIRECTIVE_VALUE');const name=validateCustomEventName(canonical.slice(6));const handler=listener as EventListener;host.addEventListener(name,handler,signal?{signal}:undefined);let active=true;return()=>{if(!active)return;active=false;host.removeEventListener(name,handler);};}
