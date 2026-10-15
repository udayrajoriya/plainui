import {normalizeJsBoundary,type JsonValue} from '../json/normalize.js';
import {freezeJson} from '../json/freeze.js';
export interface EventSnapshot {readonly type:string;readonly key:string|null;readonly button:number|null;readonly value:string|null;readonly checked:boolean|null;readonly detail:Readonly<JsonValue>}
export function snapshotEvent(event:Event):EventSnapshot {const target=event.target;const value=target instanceof HTMLInputElement||target instanceof HTMLSelectElement||target instanceof HTMLTextAreaElement?target.value:null;const checked=target instanceof HTMLInputElement&&['checkbox','radio'].includes(target.type)?target.checked:null;
  return Object.freeze({type:event.type,key:event instanceof KeyboardEvent?event.key:null,button:event instanceof MouseEvent?event.button:null,value,checked,detail:event instanceof CustomEvent?freezeJson(normalizeJsBoundary(event.detail)):null});
}
