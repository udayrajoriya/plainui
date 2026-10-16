import {PlainUIError} from '../diagnostics/codes.js';

interface TrustedTypesFacade {createPolicy(name:string,rules:{createHTML(input:string):string}):{createHTML(input:string):unknown}}
const policies=new WeakMap<object,{createHTML(input:string):unknown}>();

function importError():never {throw new PlainUIError('COMPONENT_IMPORT');}

/** The only core service permitted to parse developer-owned HTML import text. */
export class TemplateHtmlService {
  constructor(private readonly document:Document) {}
  parseImport(markup:string):DocumentFragment {
    const view=this.document.defaultView;
    if(!view)importError();
    const trustedTypes=(view as typeof view&{trustedTypes?:TrustedTypesFacade}).trustedTypes;
    let source:unknown=markup;
    try {
      if(trustedTypes){let policy=policies.get(view);if(!policy){policy=trustedTypes.createPolicy('plainui-template',{createHTML:input=>input});policies.set(view,policy);}source=policy.createHTML(markup);}
      const parsed=new view.DOMParser().parseFromString(source as string,'text/html');
      const output=this.document.createDocumentFragment();
      for(const node of [...parsed.head.childNodes,...parsed.body.childNodes]) {
        if(node.nodeType===Node.TEXT_NODE&&!(node.textContent??'').trim())continue;
        if(node.nodeType===Node.COMMENT_NODE)continue;
        if(!(node instanceof view.HTMLTemplateElement))importError();
        const declaration=node.hasAttribute('ui-component')||node.hasAttribute('data-ui-component');
        const nestedImport=node.hasAttribute('ui-import')||node.hasAttribute('data-ui-import');
        if(declaration===nestedImport)importError();
        if(node.content.querySelector('script,style,iframe,object,embed,svg,math,base,link,meta'))importError();
        output.append(this.document.importNode(node,true));
      }
      return output;
    } catch(error) {if(error instanceof PlainUIError)throw error;importError();}
  }
}

export function parseDeveloperImport(markup:string,document:Document):DocumentFragment {return new TemplateHtmlService(document).parseImport(markup);}
