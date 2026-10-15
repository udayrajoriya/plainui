import {observeFirstIntersection} from './visibility.js';

export type LoadMode='auto'|'manual'|'visible';
/** Visibility is a one-way transition to automatic loading. */
export class ResourceActivation {
  private observed=false;private visible=false;private disposed=false;private disconnect:()=>void=()=>{};
  constructor(readonly mode:LoadMode,private readonly element:Element,private readonly changed:()=>void,private readonly diagnose:(error:unknown)=>void){}
  get automatic():boolean {return !this.disposed&&(this.mode==='auto'||this.mode==='visible'&&this.visible);}
  start():void {if(this.disposed)return;this.changed();if(this.mode!=='visible'||this.observed)return;this.observed=true;try{this.disconnect=observeFirstIntersection(this.element,()=>{if(this.disposed)return;this.visible=true;this.changed();});}catch(error){this.diagnose(error);}}
  dispose():void {this.disposed=true;this.disconnect();}
}
