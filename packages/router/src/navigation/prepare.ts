import {PlainUIError} from '../../../core/src/index.js';
import type {RouteRecord} from '../../../core/src/public-api/types.js';
import type {RouteMatch} from '../match.js';
import {GuardRegistry,type NavigationGuard} from './guards.js';
import type {PreparedNavigation} from './transaction.js';

export class NavigationPreparer {
  readonly guards:GuardRegistry;private generation=0;private controller:AbortController|null=null;private active=true;
  constructor(private readonly resolve:(url:URL)=>RouteMatch,diagnose:(error:unknown)=>void){this.guards=new GuardRegistry(diagnose);}
  before(guard:NavigationGuard):()=>void {if(!this.active)throw new PlainUIError('OWNER_DISPOSED');return this.guards.add(guard);}
  async prepare(url:URL,from:RouteRecord|null,historyIntent:'push'|'replace'|'traverse'='push'):Promise<PreparedNavigation|null> {if(!this.active)throw new PlainUIError('OWNER_DISPOSED');this.controller?.abort();const controller=new AbortController(),generation=++this.generation;this.controller=controller;const match=this.resolve(url),current=()=>this.active&&this.generation===generation&&!controller.signal.aborted;const context=Object.freeze({from,to:match.route,signal:controller.signal});if(!await this.guards.run(context,current)||!current())return null;return Object.freeze({generation,from,to:match.route,url,match,historyIntent,signal:controller.signal});}
  isCurrent(transaction:PreparedNavigation):boolean {return this.active&&!transaction.signal.aborted&&transaction.generation===this.generation;}
  dispose():void {if(!this.active)return;this.active=false;this.generation++;this.controller?.abort();this.controller=null;this.guards.clear();}
}
