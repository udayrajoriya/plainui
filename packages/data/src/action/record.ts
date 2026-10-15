import type {JsonValue} from '../../../core/src/index.js';
import type {NormalizedRequestError} from '../adapter/error.js';

export interface ActionRecord {readonly pending:boolean;readonly status:'idle'|'pending'|'success'|'error';readonly data:Readonly<JsonValue>;readonly error:NormalizedRequestError|null}
export const IDLE_ACTION:ActionRecord=Object.freeze({pending:false,status:'idle',data:null,error:null});
