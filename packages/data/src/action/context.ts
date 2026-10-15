import type {ActionRecord} from './record.js';

/** Each action owns this context even when it has no named lexical binding. */
export interface ActionContext {readonly record:ActionRecord;readonly generation:number;readonly active:boolean}
export function initialActionContext():ActionContext {return Object.freeze({record:Object.freeze({pending:false,status:'idle',data:null,error:null}),generation:0,active:true});}
