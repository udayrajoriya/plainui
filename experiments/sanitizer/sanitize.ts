import DOMPurify from 'dompurify';
import { FRAGMENT_ATTRIBUTES,FRAGMENT_TAGS,FRAGMENT_DROP_SUBTREES,ENHANCED_DIRECTIVES,ENHANCED_FAMILIES,resolveDirective,bindSinkAllowed } from '../../packages/schema/src/index.js';
const purifier=DOMPurify(window);

function allowedEnhanced(name:string):boolean {
  const canonical=name.startsWith('data-ui-')?name.slice(5):name;
  if(ENHANCED_DIRECTIVES.has(canonical))return true;
  return [...ENHANCED_FAMILIES].some(family=>family==='ui-bind-*'?canonical.startsWith('ui-bind-')&&bindSinkAllowed(canonical.slice(8)):family==='ui-prop-*'?canonical.startsWith('ui-prop-'):canonical.startsWith('ui-on:')) && !!resolveDirective(canonical);
}
export function sanitizeFragment(markup:string,enhanced=false):DocumentFragment {
  const tags=[...FRAGMENT_TAGS,...(enhanced?['template']:[])];
  const attributes=[...FRAGMENT_ATTRIBUTES,...(enhanced?[...ENHANCED_DIRECTIVES,...[...ENHANCED_DIRECTIVES].map(name=>name.replace(/^ui-/,'data-ui-'))]:[])];
  const fragment=purifier.sanitize(markup,{ALLOWED_TAGS:tags,ALLOWED_ATTR:attributes,FORBID_TAGS:[...FRAGMENT_DROP_SUBTREES],RETURN_DOM_FRAGMENT:true,ALLOW_DATA_ATTR:true,ALLOW_ARIA_ATTR:true} as const) as DocumentFragment;
  if(!fragment)throw new Error('DOMPurify returned an empty fragment object');
  const visit=(parent:ParentNode):void=>{
    for(const child of [...parent.children]){
      if(child.localName==='template'){
        if(!enhanced || ![...child.attributes].some(attribute=>allowedEnhanced(attribute.name))) {child.remove();continue;}
        const content=(child as HTMLTemplateElement).content;
        if(content)visit(content);
      }
      for(const attribute of [...child.attributes]){
        const name=attribute.name;
        if(name.startsWith('ui-')||name.startsWith('data-ui-')){if(!enhanced||!allowedEnhanced(name))child.removeAttribute(name);continue;}
        if(name.startsWith('on')||['style','srcdoc','formaction','formtarget'].includes(name))child.removeAttribute(name);
      }
      visit(child);
    }
  };
  visit(fragment);
  return fragment;
}
