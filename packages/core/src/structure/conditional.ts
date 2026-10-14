import {canonicalDirective} from '../../../schema/src/directives.js';
import {PlainUIError} from '../diagnostics/codes.js';
import {createRange,insertRange,type DomRange} from '../ownership/range.js';
import type {Owner,OwnerTree} from '../ownership/owner.js';
import {truthy} from '../expression/evaluate.js';
import type {JsonValue} from '../json/normalize.js';

export interface ConditionalBranch {readonly template:HTMLTemplateElement;readonly kind:'if'|'else-if'|'else';readonly expression:string|null}
export interface ConditionalSpec {readonly branches:readonly ConditionalBranch[];readonly issue?:'DIRECTIVE_CONFLICT'|'DIRECTIVE_VALUE'}
function directive(element:Element):{kind:ConditionalBranch['kind'];value:string}|null {for(const attribute of element.attributes){const name=canonicalDirective(attribute.name);if(name==='ui-if'||name==='ui-else-if'||name==='ui-else')return {kind:name.slice(3) as ConditionalBranch['kind'],value:attribute.value};}return null;}
export function collectConditionalChains(parent:ParentNode):ConditionalSpec[] {
  const result:ConditionalSpec[]=[];const nodes=[...parent.childNodes];let i=0;
  while(i<nodes.length){const node=nodes[i++]!;if(!(node instanceof Element))continue;const first=directive(node);if(!first)continue;
    if(!(node instanceof HTMLTemplateElement)){result.push({branches:[],issue:'DIRECTIVE_VALUE'});continue;}
    if(first.kind!=='if'||[...node.attributes].some(attribute=>canonicalDirective(attribute.name)==='ui-for')){result.push({branches:[],issue:'DIRECTIVE_CONFLICT'});continue;}
    const branches:ConditionalBranch[]=[{template:node,kind:'if',expression:first.value}];let seenElse=false;let issue:ConditionalSpec['issue'];
    while(i<nodes.length){let j=i;while(j<nodes.length&&(nodes[j]!.nodeType===Node.COMMENT_NODE||nodes[j]!.nodeType===Node.TEXT_NODE&&!(nodes[j]!.textContent??'').trim()))j++;
      const candidate=nodes[j];if(!(candidate instanceof Element))break;const next=directive(candidate);if(!next||next.kind==='if')break;
      if(!(candidate instanceof HTMLTemplateElement)||next.kind==='else'&&next.value!==''){issue='DIRECTIVE_VALUE';break;}if(seenElse){issue='DIRECTIVE_CONFLICT';break;}
      if(next.kind==='else')seenElse=true;branches.push({template:candidate,kind:next.kind,expression:next.kind==='else'?null:next.value});i=j+1;
    }
    result.push({branches,...(issue?{issue}:{})});
  }
  return result;
}
export type ConditionalEvaluation={ok:true;value:JsonValue}|{ok:false;code:'EXPRESSION_LIMIT'|'EXPRESSION_TYPE'};
export class ConditionalChain {
  readonly owner:Owner;readonly range:DomRange;private activeIndex=-1;private branchOwner:Owner|null=null;
  constructor(private readonly tree:OwnerTree,parentOwner:Owner,readonly spec:ConditionalSpec,private readonly evaluate:(expression:string)=>ConditionalEvaluation,private readonly activate:(nodes:readonly Node[],owner:Owner)=>void,private readonly onError:(error:unknown)=>void){
    if(spec.issue||!spec.branches.length)throw new PlainUIError(spec.issue??'DIRECTIVE_VALUE');const first=spec.branches[0]!.template;const parent=first.parentNode;if(!parent)throw new PlainUIError('OWNER_RANGE');this.owner=tree.create(parentOwner,'conditional');this.range=createRange(tree,this.owner,first.ownerDocument);insertRange(tree,this.range,parent,first,first.ownerDocument.createDocumentFragment());
  }
  update():void {if(!this.owner.active)return;let selection=-1;
    for(let index=0;index<this.spec.branches.length;index++){const branch=this.spec.branches[index]!;if(branch.kind==='else'){selection=index;break;}
      const result=this.evaluate(branch.expression!);if(!result.ok){this.onError(new PlainUIError(result.code));if(result.code==='EXPRESSION_LIMIT')return;continue;}if(truthy(result.value)){selection=index;break;}}
    if(selection===this.activeIndex)return;this.branchOwner&&this.tree.dispose(this.branchOwner);this.branchOwner=null;this.activeIndex=selection;
    if(selection<0)return;const branch=this.spec.branches[selection]!;const fragment=branch.template.content.cloneNode(true) as DocumentFragment;const nodes=[...fragment.childNodes];const owner=this.tree.create(this.owner,'fragment');const range=createRange(this.tree,owner,branch.template.ownerDocument);insertRange(this.tree,range,this.range.start.parentNode!,this.range.end,fragment);this.branchOwner=owner;this.activate(nodes,owner);
  }
  get selectedIndex():number{return this.activeIndex;}
}
