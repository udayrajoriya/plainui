import {BIND_ATTRIBUTES,BOOLEAN_ATTRIBUTES,bindSinkAllowed} from '../../../schema/src/allowlists.js';
import {PlainUIError} from '../diagnostics/codes.js';
import type {JsonValue} from '../json/normalize.js';
import {safeUrl} from './url.js';
export function setAttribute(element:Element,name:string,value:JsonValue):boolean {
  if(!bindSinkAllowed(name)||name.startsWith('on')||name==='style'||name==='srcdoc'||name.startsWith('data-ui-'))throw new PlainUIError('DIRECTIVE_VALUE');
  if(value!==null&&typeof value==='object')throw new PlainUIError('EXPRESSION_TYPE');
  if(name==='value'&&'value' in element){const next=value===null?'':String(value);if((element as HTMLInputElement).value===next)return false;(element as HTMLInputElement).value=next;return true;}
  if(name==='checked'&&'checked' in element){const next=value!==null&&value!==false;if((element as HTMLInputElement).checked===next)return false;(element as HTMLInputElement).checked=next;return true;}
  if(BOOLEAN_ATTRIBUTES.has(name)){const next=value!==null&&value!==false;if(element.hasAttribute(name)===next)return false;element.toggleAttribute(name,next);return true;}
  if(value===null){if(!element.hasAttribute(name))return false;element.removeAttribute(name);return true;}
  let next=String(value);if(name==='href'||name==='src')try{next=safeUrl(element,name,next);}catch(error){element.removeAttribute(name);throw error;}
  if(element.getAttribute(name)===next)return false;element.setAttribute(name,next);return true;
}
export {BIND_ATTRIBUTES};
