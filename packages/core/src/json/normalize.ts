import { FORBIDDEN_KEYS } from '../../../schema/src/allowlists.js';
import { PlainUIError } from '../diagnostics/codes.js';
export type JsonValue=null|boolean|string|number|JsonValue[]|{[key:string]:JsonValue};
type Frame={source:object;target:JsonValue[]|Record<string,JsonValue>;keys:string[];cursor:number;array:boolean};
const fail=():never=>{throw new PlainUIError('JSON_INVALID');};
function primitive(value:unknown):JsonValue|undefined {
  if(value===null||value===undefined)return null;
  if(typeof value==='string'||typeof value==='boolean')return value;
  if(typeof value==='number')return Number.isFinite(value)?value:fail();
  return undefined;
}
export function normalizeJson(input:unknown,options:{sparseArrayHoles?:'null'}={}):JsonValue {
  const direct=primitive(input);if(direct!==undefined)return direct;
  if(typeof input!=='object'||input===null)return fail();
  const ancestry=new Set<object>();
  const frames:Frame[]=[];
  const make=(source:object):JsonValue[]|Record<string,JsonValue>=>{
    if(ancestry.has(source))fail();
    const array=Array.isArray(source);
    const prototype=Object.getPrototypeOf(source);
    if(!array && prototype!==Object.prototype && prototype!==null)fail();
    if(array && prototype!==Array.prototype)fail();
    if(Reflect.ownKeys(source).some(key=>typeof key==='symbol'))fail();
    const target=array?new Array<JsonValue>((source as unknown[]).length):Object.create(null) as Record<string,JsonValue>;
    const ownNames=Object.getOwnPropertyNames(source);
    const keys=array?Array.from({length:(source as unknown[]).length},(_,index)=>String(index)):ownNames;
    if(array)for(const key of Object.getOwnPropertyNames(source))if(key!=='length' && !/^(0|[1-9][0-9]*)$/.test(key))fail();
    if(!array)for(const key of ownNames)if(!Object.getOwnPropertyDescriptor(source,key)?.enumerable)fail();
    ancestry.add(source);frames.push({source,target,keys,cursor:0,array});return target;
  };
  const result=make(input);
  while(frames.length){
    const frame=frames[frames.length-1]!;
    if(frame.cursor===frame.keys.length){ancestry.delete(frame.source);frames.pop();continue;}
    const key=frame.keys[frame.cursor++]!;
    if(FORBIDDEN_KEYS.has(key))fail();
    const descriptor=Object.getOwnPropertyDescriptor(frame.source,key);
    if(!descriptor){if(frame.array&&options.sparseArrayHoles==='null'){(frame.target as JsonValue[])[Number(key)]=null;continue;}throw new PlainUIError('JSON_INVALID');}
    if(!('value' in descriptor))throw new PlainUIError('JSON_INVALID');
    const value=primitive(descriptor.value);
    const converted=value===undefined?(typeof descriptor.value==='object' && descriptor.value!==null?make(descriptor.value):fail()):value;
    if(frame.array)(frame.target as JsonValue[])[Number(key)]=converted;
    else (frame.target as Record<string,JsonValue>)[key]=converted;
  }
  return result;
}
export function parseSafeJson(source:string):JsonValue { try{return normalizeJson(JSON.parse(source));}catch{return fail();} }
export function normalizeJsBoundary(input:unknown):JsonValue { return normalizeJson(input,{sparseArrayHoles:'null'}); }
