import type {JsonValue} from '../../../core/src/index.js';
import type {NormalizedRequestError} from '../adapter/error.js';

export interface ResourceRecord {readonly data:Readonly<JsonValue>;readonly status:'idle'|'loading'|'success'|'error';readonly loading:boolean;readonly refreshing:boolean;readonly error:NormalizedRequestError|null;readonly empty:boolean;readonly stale:boolean;readonly updatedAt:number|null}
export const IDLE_RESOURCE:ResourceRecord=Object.freeze({data:null,status:'idle',loading:false,refreshing:false,error:null,empty:false,stale:false,updatedAt:null});
export function emptyData(value:JsonValue):boolean {return value===null||value===''||Array.isArray(value)&&value.length===0;}
