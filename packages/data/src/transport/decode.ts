import {normalizeJsBoundary} from '../../../core/src/index.js';
import type {JsonValue} from '../../../core/src/index.js';
import {normalizeRequestError} from '../adapter/error.js';

export function isJsonMediaType(value:string|null):boolean {if(!value)return false;const media=value.split(';',1)[0]!.trim().toLowerCase();return media==='application/json'||/^application\/[a-z0-9!#$&^_.+-]+\+json$/.test(media);}
export function isHtmlMediaType(value:string|null):boolean {return value?.split(';',1)[0]!.trim().toLowerCase()==='text/html';}
export function decodeJsonSuccess(text:string,status:number,contentType:string|null):JsonValue {if(status===204||text.length===0)return null;if(!isJsonMediaType(contentType))throw normalizeRequestError('parse',status,{code:'RESPONSE_TYPE'});try{return normalizeJsBoundary(JSON.parse(text));}catch{throw normalizeRequestError('parse',status,{code:'RESPONSE_PARSE'});}}
export function decodeHttpErrorBody(text:string,contentType:string|null):JsonValue|null {if(!text||!isJsonMediaType(contentType))return null;try{return normalizeJsBoundary(JSON.parse(text));}catch{return null;}}
