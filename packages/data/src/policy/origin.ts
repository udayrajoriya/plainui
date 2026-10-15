import {PlainUIError} from '../../../core/src/index.js';

export function validateRequestUrl(input:string|URL,allowedOrigins:readonly string[]):URL {let url:URL;try{url=new URL(String(input));}catch{throw new PlainUIError('URL_POLICY');}if(!['http:','https:'].includes(url.protocol)||url.username||url.password)throw new PlainUIError('URL_POLICY');url.hash='';if(!allowedOrigins.includes(url.origin))throw new PlainUIError('REQUEST_ORIGIN');return url;}
