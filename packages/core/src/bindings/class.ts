import {PlainUIError} from '../diagnostics/codes.js';
import type {JsonValue} from '../json/normalize.js';
export class ClassBinding {
  private readonly staticTokens:Set<string>;private owned=new Set<string>();
  constructor(private readonly element:Element){this.staticTokens=new Set(element.classList);}
  update(value:JsonValue):void {const next=new Set<string>();if(typeof value==='string'){for(const token of value.trim().split(/\s+/))if(token)next.add(token);}
    else if(Array.isArray(value)){for(const item of value){if(typeof item!=='string')throw new PlainUIError('EXPRESSION_TYPE');for(const token of item.trim().split(/\s+/))if(token)next.add(token);}}
    else if(value&&typeof value==='object'){for(const [token,enabled] of Object.entries(value)){if(typeof enabled!=='boolean')throw new PlainUIError('EXPRESSION_TYPE');if(enabled)next.add(token);}}
    else if(value!==null)throw new PlainUIError('EXPRESSION_TYPE');
    for(const token of this.owned)if(!next.has(token)&&!this.staticTokens.has(token))this.element.classList.remove(token);
    for(const token of next)if(!this.element.classList.contains(token))this.element.classList.add(token);
    this.owned=next;
  }
}
