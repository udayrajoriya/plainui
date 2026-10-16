import {PlainUIError} from '../../core/src/index.js';
import type {RouteRecord} from '../../core/src/public-api/types.js';
import type {RouteMatch} from './match.js';

const outlets=new WeakSet<Element>();
export function isRouterOutlet(element:Element):boolean {return outlets.has(element);}
export interface PreparedRouteView {readonly match:RouteMatch;readonly fragment:DocumentFragment}
export interface RouteViewHooks<Scope> {readonly precompile?:(fragment:DocumentFragment,match:RouteMatch)=>void;readonly createScope:(route:RouteRecord)=>Scope;readonly publish:(route:RouteRecord)=>void;readonly activate:(outlet:Element,scope:Scope,signal:AbortSignal)=>void|(()=>void);readonly startResources?:(scope:Scope,signal:AbortSignal)=>void}

export class RouteView<Scope> {
  private release:(()=>void)|null=null;private controller:AbortController|null=null;private active=true;scope:Scope|null=null;
  constructor(readonly outlet:Element,private readonly hooks:RouteViewHooks<Scope>){if(outlets.has(outlet))throw new PlainUIError('ROUTE_INVALID');outlets.add(outlet);}
  prepare(match:RouteMatch):PreparedRouteView {if(!this.active)throw new PlainUIError('OWNER_DISPOSED');const fragment=match.declaration.template.content.cloneNode(true) as DocumentFragment;this.hooks.precompile?.(fragment,match);return Object.freeze({match,fragment});}
  commit(prepared:PreparedRouteView):Scope {if(!this.active||!this.outlet.isConnected)throw new PlainUIError('OWNER_DISPOSED');this.controller?.abort();this.release?.();const controller=new AbortController(),scope=this.hooks.createScope(prepared.match.route);this.controller=controller;this.scope=scope;this.hooks.publish(prepared.match.route);this.outlet.replaceChildren(prepared.fragment);const release=this.hooks.activate(this.outlet,scope,controller.signal);this.release=release??null;queueMicrotask(()=>{if(this.active&&!controller.signal.aborted)this.hooks.startResources?.(scope,controller.signal);});return scope;}
  dispose():void {if(!this.active)return;this.active=false;this.controller?.abort();this.release?.();this.release=null;this.controller=null;this.scope=null;this.outlet.replaceChildren();outlets.delete(this.outlet);}
}
