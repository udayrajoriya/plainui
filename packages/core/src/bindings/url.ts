import {PlainUIError} from '../diagnostics/codes.js';
export function safeUrl(element:Element,name:'href'|'src',input:string):string {let url:URL;try{url=new URL(input,element.ownerDocument.baseURI);}catch{throw new PlainUIError('URL_POLICY');}if(url.username||url.password||!['http:','https:'].includes(url.protocol))throw new PlainUIError('URL_POLICY');return url.href;}
