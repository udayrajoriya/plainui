import {PlainUIError} from '@plainui/runtime-bridge';
import {FragmentHtmlService} from './html-service.js';
import type {FragmentSwapMode} from './action-mode.js';

const forbiddenEnhanced=new Set(['ui-app','data-ui-app','ui-store','data-ui-store','ui-route','data-ui-route','ui-outlet','data-ui-outlet','ui-import','data-ui-import','ui-component','data-ui-component','ui-persist','data-ui-persist','ui-persist-key','data-ui-persist-key','ui-toasts','data-ui-toasts']);
function fail():never {throw new PlainUIError('FRAGMENT_POLICY');}
function elements(fragment:DocumentFragment):Element[]{const result:Element[]=[];const visit=(parent:ParentNode):void=>{for(const element of [...parent.children]){result.push(element);if(element instanceof HTMLTemplateElement)visit(element.content);else visit(element);}};visit(fragment);return result;}
function attemptedForbidden(markup:unknown):boolean {const source=String(markup);return [...forbiddenEnhanced].some(name=>new RegExp(`(?:\\s|<)${name.replace(':','\\:')}(?:\\s|=|>|/)`,'iu').test(source));}
function scheduledForRemoval(node:Element,destination:Element,mode:FragmentSwapMode):boolean {return mode==='outer'&&(node===destination||destination.contains(node))||mode==='inner'&&node!==destination&&destination.contains(node);}

export interface FragmentCandidateOptions {
  readonly document:Document;readonly root:Element;readonly destination:Element;readonly markup:unknown;readonly mode:FragmentSwapMode;readonly enhanced:boolean;readonly components?:Readonly<Record<string,readonly string[]>>;readonly targetRef?:string;readonly retainedRefs?:ReadonlySet<string>;readonly availableModules?:ReadonlySet<string>;readonly validate?:(fragment:DocumentFragment,signal:AbortSignal)=>void;
}
export class FragmentCandidate {
  readonly fragment:DocumentFragment;readonly replacement:Element|null;readonly transferredRef:string|null;readonly controller=new AbortController();private active=true;
  constructor(readonly options:FragmentCandidateOptions){if(!options.root.contains(options.destination)&&options.root!==options.destination)fail();if(options.enhanced&&attemptedForbidden(options.markup))fail();const service=new FragmentHtmlService(options.document);let fragment:DocumentFragment;try{fragment=service.sanitize(options.markup,{enhanced:options.enhanced,...(options.components?{components:options.components}:{})}).fragment;}finally{service.release();}const all=elements(fragment);for(const element of all){for(const attribute of [...element.attributes])if(forbiddenEnhanced.has(attribute.name))fail();const requirement=element.getAttribute('data-ui-requires');if(requirement&&!requirement.split(/\s+/u).every(name=>options.availableModules?.has(name)))fail();}
    const ids=new Set<string>();for(const element of all)if(element.id){if(ids.has(element.id))fail();ids.add(element.id);const retained=options.document.getElementById(element.id);if(retained&&!scheduledForRemoval(retained,options.destination,options.mode))fail();}
    const refs=new Set<string>();for(const element of all){const ref=element.getAttribute('ui-ref')??element.getAttribute('data-ui-ref');if(!ref)continue;if(refs.has(ref)||options.retainedRefs?.has(ref)&&!(options.mode==='outer'&&ref===options.targetRef))fail();refs.add(ref);}
    const top=[...fragment.childNodes].filter(node=>node.nodeType!==Node.COMMENT_NODE&&(node.nodeType!==Node.TEXT_NODE||Boolean(node.textContent?.trim())));let replacement:Element|null=null,transferredRef:string|null=null;if(options.mode==='outer'){if(top.length!==1||!(top[0] instanceof Element))fail();replacement=top[0];if(options.targetRef){if(options.enhanced){if((replacement.getAttribute('ui-ref')??replacement.getAttribute('data-ui-ref'))!==options.targetRef)fail();}else transferredRef=options.targetRef;}}
    try{options.validate?.(fragment,this.controller.signal);}catch{this.controller.abort();fail();}this.fragment=fragment;this.replacement=replacement;this.transferredRef=transferredRef;
  }
  take():DocumentFragment {if(!this.active||this.controller.signal.aborted)throw new PlainUIError('OWNER_DISPOSED');this.active=false;return this.fragment;}
  release():void {if(!this.active)return;this.active=false;this.controller.abort();this.fragment.replaceChildren();}
}
export function prepareFragmentCandidate(options:FragmentCandidateOptions):FragmentCandidate {return new FragmentCandidate(options);}
