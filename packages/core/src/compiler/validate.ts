import {validateAttributeSet,type DirectiveIssue} from '../../../schema/src/directives.js';
import type {NormalizedDirective} from './normalize.js';
export function validateElement(element:Element,directives:readonly NormalizedDirective[]):DirectiveIssue[] {
  const values=new Map(directives.map(item=>[item.name,item.value]));const attributes=new Map(directives.map(item=>[item.sourceName,item.value]));
  const issues=validateAttributeSet(attributes,{tagName:element.localName,hasOwnedChildren:element.children.length>0&&element.localName!=='template'});
  if(values.has('ui-persist')&&values.has('ui-state')&&values.has('ui-store'))issues.push({code:'DIRECTIVE_CONFLICT',name:'ui-persist'});
  if(values.has('ui-text')&&values.has('ui-component'))issues.push({code:'DIRECTIVE_CONFLICT',name:'ui-text'});
  if(values.has('ui-show')&&values.has('ui-bind-hidden'))issues.push({code:'DIRECTIVE_CONFLICT',name:'ui-show'});
  if(values.has('ui-src')&&values.has('ui-bind-src'))issues.push({code:'DIRECTIVE_CONFLICT',name:'ui-src'});
  if(values.has('ui-href')&&values.has('ui-bind-href'))issues.push({code:'DIRECTIVE_CONFLICT',name:'ui-href'});
  if(values.has('ui-model')&&(values.has('ui-bind-value')||values.has('ui-bind-checked')))issues.push({code:'DIRECTIVE_CONFLICT',name:'ui-model'});
  if(values.has('ui-field-error')){const form=element.closest('form');if(!form||!['ui-get','ui-post','ui-put','ui-patch','ui-delete','data-ui-get','data-ui-post','data-ui-put','data-ui-patch','data-ui-delete'].some(name=>form.hasAttribute(name)))issues.push({code:'FORM_INVALID',name:'ui-field-error'});}
  return issues;
}
