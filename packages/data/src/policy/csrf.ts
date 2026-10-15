import {PlainUIError} from '../../../core/src/index.js';
import {validateHeaderName} from './headers.js';

export interface CsrfPolicy {readonly header:string;readonly meta:string}
export function applyCsrf(headers:Headers,method:string,url:URL,document:Document,policy:CsrfPolicy|null):void {if(!policy||!['POST','PUT','PATCH','DELETE'].includes(method))return;const name=validateHeaderName(policy.header);if(url.origin!==document.location.origin){headers.delete(name);return;}const meta=[...document.querySelectorAll('meta[name]')].find(item=>item.getAttribute('name')===policy.meta);const token=meta?.getAttribute('content')?.trim();if(!token||/[\r\n\0]/.test(token))throw new PlainUIError('REQUEST_INVALID');headers.set(name,token);}
