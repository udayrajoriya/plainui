import {PlainUIError} from '../diagnostics/codes.js';
import type {JsonValue} from '../json/normalize.js';
export function setText(element:Element,value:JsonValue):boolean {if(value!==null&&typeof value==='object')throw new PlainUIError('EXPRESSION_TYPE');const next=value===null?'':String(value);if(element.textContent===next)return false;element.textContent=next;return true;}
