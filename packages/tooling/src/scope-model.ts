import {canonicalDirective} from '../../schema/src/directives.js';
import type {HtmlDocument,HtmlNode} from './html-adapter.js';

export interface ScopeDuplicate {readonly name:string;readonly node:HtmlNode;readonly first:HtmlNode}
const declarationNames=['ui-data','ui-derived','ui-action','ui-ref','ui-component'] as const;
function value(node:HtmlNode,name:string):string|undefined {for(const [key,item] of node.attributes)if(canonicalDirective(key)===name)return item;return undefined;}
export class StaticScopeModel {
  readonly roots:HtmlNode[]=[];readonly duplicates:ScopeDuplicate[]=[];readonly declarations=new Map<HtmlNode,Map<string,HtmlNode>>();
  constructor(readonly document:HtmlDocument){this.build();}
  private build():void {for(const node of this.document.nodes)if(value(node,'ui-app')!==undefined)this.roots.push(node);for(const root of this.roots){const names=new Map<string,HtmlNode>();this.declarations.set(root,names);this.walk(root,root,names);}}
  private walk(node:HtmlNode,root:HtmlNode,names:Map<string,HtmlNode>):void {if(node!==root&&value(node,'ui-app')!==undefined)return;for(const directive of declarationNames){const name=value(node,directive)?.trim();if(!name)continue;const key=`${directive}:${name}`,first=names.get(key);if(first)this.duplicates.push({name,node,first});else names.set(key,node);}for(const child of node.children)this.walk(child,root,names);}
  containingRoot(node:HtmlNode):HtmlNode|undefined {let current:HtmlNode|null=node;while(current){if(this.roots.includes(current))return current;current=current.parent;}return undefined;}
}
