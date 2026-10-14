/** Private, developer-controlled component-import parser. Never use on network fragment HTML. */
const policies=new WeakMap<object,{createHTML:(input:string)=>unknown}>();
export function parseDeveloperImport(markup:string,ownerDocument:Document):DocumentFragment {
  const view=ownerDocument.defaultView;
  if(!view)throw new Error('Document has no browsing context');
  const trustedTypes=(view as typeof view & {trustedTypes?:{createPolicy:(name:string,callbacks:{createHTML:(input:string)=>string})=>{createHTML:(input:string)=>unknown}}}).trustedTypes;
  let source:unknown=markup;
  if(trustedTypes) {
    let policy=policies.get(view);
    if(!policy){policy=trustedTypes.createPolicy('plainui-template',{createHTML:input=>input});policies.set(view,policy);}
    source=policy.createHTML(markup);
  }
  const parsed=new view.DOMParser().parseFromString(source as string,'text/html');
  const output=ownerDocument.createDocumentFragment();
  for(const node of [...parsed.head.childNodes,...parsed.body.childNodes]) {
    if(node.nodeType===Node.TEXT_NODE && !(node.textContent??'').trim())continue;
    if(node.nodeType===Node.COMMENT_NODE)continue;
    if(!(node instanceof view.HTMLTemplateElement))throw new Error('Component import contains an unsupported top-level node');
    if(!node.hasAttribute('ui-component')&&!node.hasAttribute('data-ui-component')&&!node.hasAttribute('ui-import')&&!node.hasAttribute('data-ui-import'))throw new Error('Component import template lacks a definition or import');
    if(node.content.querySelector('script,style,iframe,object,embed,svg,math'))throw new Error('Component import contains executable or unsupported content');
    output.append(ownerDocument.importNode(node,true));
  }
  return output;
}
