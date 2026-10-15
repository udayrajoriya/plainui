import {PlainUIError,type JsonValue} from '../../../core/src/index.js';
import {CacheInvalidator,type CacheConsumer} from '../cache/invalidate.js';

/** Public refresh bypasses settled cache and shares one current-generation outcome. */
export function refreshResource(key:string|null,invalidator:CacheInvalidator,consumer:CacheConsumer,run:()=>Promise<JsonValue>):Promise<JsonValue> {if(key===null)return Promise.reject(new PlainUIError('RESOURCE_SUSPENDED'));return invalidator.refresh(key,run,consumer);}
