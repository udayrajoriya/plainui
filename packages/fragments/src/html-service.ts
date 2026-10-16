import createDOMPurify from 'dompurify';
import {PlainUIError} from '@plainui/runtime-bridge';
import {allowedFragmentAttribute} from './attributes.js';
import {createFragmentPolicy,validateFragmentElement,type FragmentPolicy} from './policy.js';
import {allowedFragmentTag,DROPPED_FRAGMENT_SUBTREES,REMOVED_METADATA_TAGS} from './tags.js';

export interface SanitationReport {readonly removedElements:number;readonly removedAttributes:number}
export interface SanitizedFragment {readonly fragment:DocumentFragment;readonly report:SanitationReport}
type Purifier=ReturnType<typeof createDOMPurify>;
const instances=new WeakMap<Document,{purifier:Purifier;refs:number}>();

function walk(parent:ParentNode,visit:(element:Element)=>void):void {for(const element of [...parent.children]){visit(element);if(element instanceof HTMLTemplateElement)walk(element.content,visit);else walk(element,visit);}}
function validate(fragment:DocumentFragment,policy:FragmentPolicy,baseURI:string):void {walk(fragment,element=>validateFragmentElement(element,policy,baseURI));}
function sanitizeTemplates(purifier:Purifier,fragment:DocumentFragment,options:Record<string,unknown>):void {for(const template of [...fragment.querySelectorAll('template')]){const sanitized=purifier.sanitize(template.innerHTML,options) as unknown as DocumentFragment;template.content.replaceChildren(sanitized);sanitizeTemplates(purifier,template.content,options);}}

/** The only fragments service permitted to parse untrusted response HTML. */
export class FragmentHtmlService {
  private readonly purifier:Purifier;private released=false;
  constructor(readonly document:Document){let record=instances.get(document);if(!record){const view=document.defaultView;if(!view)throw new PlainUIError('FRAGMENT_POLICY');try{record={purifier:createDOMPurify(view as any),refs:0};}catch{throw new PlainUIError('FRAGMENT_POLICY');}instances.set(document,record);}record.refs++;this.purifier=record.purifier;}
  sanitize(markup:unknown,options:{readonly enhanced?:boolean;readonly components?:Readonly<Record<string,readonly string[]>>}={}):SanitizedFragment {if(this.released)throw new PlainUIError('OWNER_DISPOSED');const policy=createFragmentPolicy(options.enhanced===true,options.components),components=new Set(policy.componentProps.keys());let fragment:DocumentFragment;const purifierOptions:Record<string,unknown>={ALLOWED_TAGS:[],ALLOWED_ATTR:[],ADD_TAGS:(name:string)=>allowedFragmentTag(name,policy.enhanced,components),ADD_ATTR:(name:string,tag:string)=>allowedFragmentAttribute(name,tag,policy.enhanced,policy.componentProps),FORBID_TAGS:[...DROPPED_FRAGMENT_SUBTREES,...REMOVED_METADATA_TAGS],FORBID_CONTENTS:[...DROPPED_FRAGMENT_SUBTREES,...REMOVED_METADATA_TAGS],ALLOW_DATA_ATTR:false,ALLOW_ARIA_ATTR:false,RETURN_DOM_FRAGMENT:true,RETURN_TRUSTED_TYPE:false,CUSTOM_ELEMENT_HANDLING:{tagNameCheck:(tag:string)=>components.has(tag),attributeNameCheck:null,allowCustomizedBuiltInElements:false}};try{fragment=this.purifier.sanitize(String(markup),purifierOptions as any) as unknown as DocumentFragment;sanitizeTemplates(this.purifier,fragment,purifierOptions);validate(fragment,policy,this.document.baseURI);}catch{throw new PlainUIError('FRAGMENT_POLICY');}const removed=this.purifier.removed??[],report=Object.freeze({removedElements:removed.filter(item=>'element' in item).length,removedAttributes:removed.filter(item=>'attribute' in item).length});return Object.freeze({fragment,report});}
  replace(target:Element,markup:unknown,options:{readonly enhanced?:boolean;readonly components?:Readonly<Record<string,readonly string[]>>}={}):SanitationReport {const value=this.sanitize(markup,options);target.replaceChildren(value.fragment);return value.report;}
  release():void {if(this.released)return;this.released=true;const record=instances.get(this.document);if(record)record.refs=Math.max(0,record.refs-1);}
}

export {FragmentHtmlService as FragmentSanitizer};
export function sanitizeFragment(document:Document,markup:unknown,options:{readonly enhanced?:boolean;readonly components?:Readonly<Record<string,readonly string[]>>}={}):SanitizedFragment {const service=new FragmentHtmlService(document);try{return service.sanitize(markup,options);}finally{service.release();}}
