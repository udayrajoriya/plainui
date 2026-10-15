import type {ResponseMetadata} from '../adapter/registry.js';

export function responseMetadata(response:Response):ResponseMetadata {const headers:Record<string,string>=Object.create(null);response.headers.forEach((value,name)=>{if(name.toLowerCase()!=='set-cookie')headers[name.toLowerCase()]=value;});return Object.freeze({status:response.status,statusText:response.statusText,url:response.url,headers:Object.freeze(headers)});}
export function responseRequestId(response:Response):string|null {const value=response.headers.get('x-request-id');return value&&value.length<=256&&/^[\x20-\x7e]+$/.test(value)?value:null;}
