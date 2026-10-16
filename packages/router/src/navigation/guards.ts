import {PlainUIError,type RouteRecord} from '@plainui/runtime-bridge';

export interface NavigationGuardContext {readonly from:RouteRecord|null;readonly to:RouteRecord;readonly signal:AbortSignal}
export type NavigationGuard=(context:NavigationGuardContext)=>boolean|void|Promise<boolean|void>;

export class GuardRegistry {
  private readonly guards:NavigationGuard[]=[];
  constructor(private readonly diagnose:(error:unknown)=>void){}
  add(guard:NavigationGuard):()=>void {this.guards.push(guard);let active=true;return()=>{if(!active)return;active=false;const index=this.guards.indexOf(guard);if(index>=0)this.guards.splice(index,1);};}
  async run(context:NavigationGuardContext,current:()=>boolean):Promise<boolean> {for(const guard of [...this.guards]){if(!current()||context.signal.aborted)return false;try{if(await guard(Object.freeze(context))===false)return false;}catch{if(current()&&!context.signal.aborted)this.diagnose(new PlainUIError('GUARD_ERROR'));return false;}if(!current()||context.signal.aborted)return false;}return true;}
  clear():void {this.guards.length=0;}
}
