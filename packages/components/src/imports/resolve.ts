import {PlainUIError} from '../../../core/src/index.js';

export function resolveImport(source:string,base:string,documentOrigin:string):URL {let url:URL;try{url=new URL(source,base);}catch{throw new PlainUIError('COMPONENT_IMPORT');}if(!['http:','https:'].includes(url.protocol)||url.origin!==documentOrigin||url.username||url.password)throw new PlainUIError('COMPONENT_IMPORT');url.hash='';return url;}
export function cyclePath(urls:readonly string[]):string {return urls.map(value=>new URL(value).pathname).join(' → ');}
