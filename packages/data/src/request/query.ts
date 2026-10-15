import {normalizeJsBoundary,PlainUIError} from '../../../core/src/index.js';
import type {JsonValue} from '../../../core/src/index.js';

function scalar(value:JsonValue):string {if(typeof value==='string'||typeof value==='boolean'||typeof value==='number')return String(value);throw new PlainUIError('REQUEST_INVALID');}
/** Replaces every literal occurrence of supplied keys, preserving the remaining pair order. */
export function applyQuery(url:URL,input:unknown):URL {const normalized=normalizeJsBoundary(input);if(normalized===null||Array.isArray(normalized)||typeof normalized!=='object')throw new PlainUIError('REQUEST_INVALID');const result=new URL(url.href);
  for(const [key,value] of Object.entries(normalized)){result.searchParams.delete(key);if(value===null)continue;if(Array.isArray(value)){for(const item of value)if(item!==null)result.searchParams.append(key,scalar(item));}else result.searchParams.append(key,scalar(value));}
  return result;
}
