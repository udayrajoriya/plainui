export function scrollRoute(outlet:Element,hash:string,position:readonly [number,number]|null=null):void {const view=outlet.ownerDocument.defaultView;if(!view||!outlet.isConnected)return;if(hash){const target=outlet.ownerDocument.getElementById(hash);if(target&&outlet.contains(target)){target.scrollIntoView();return;}}if(position)view.scrollTo(position[0],position[1]);else view.scrollTo(0,0);}

export class RoutePostFlushEffects {private cancel:(()=>void)|null=null;private generation=0;constructor(private readonly afterFlush:(callback:()=>void)=>()=>void=callback=>{let active=true;queueMicrotask(()=>{if(active)callback();});return()=>{active=false;};}){}
  schedule(outlet:Element,hash:string,position:readonly [number,number]|null=null):void {this.cancel?.();const generation=++this.generation;this.cancel=this.afterFlush(()=>{if(generation!==this.generation||!outlet.isConnected)return;const controller=new AbortController(),releaseFocus=focusRoute(outlet,controller.signal);scrollRoute(outlet,hash,position);this.cancel=()=>{controller.abort();releaseFocus();};});}
  dispose():void {this.generation++;this.cancel?.();this.cancel=null;}
}
import {focusRoute} from './focus.js';
