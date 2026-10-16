import {PlainUIError} from '@plainui/runtime-bridge';
import {normalizeBasePath} from './location.js';

export function navigationKind(input:string|URL,current:string|URL,basePath:string):{readonly kind:'router'|'document';readonly url:URL} {const base=new URL(current),url=new URL(input,base);if(!['http:','https:'].includes(url.protocol)||url.origin!==base.origin)throw new PlainUIError('URL_POLICY');const path=normalizeBasePath(basePath);return {kind:path==='/'||url.pathname===path||url.pathname.startsWith(`${path}/`)?'router':'document',url};}
export function nativeNavigate(view:Window,url:URL):void {view.location.assign(url.href);}
