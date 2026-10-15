/** Restores only attributes and button states changed by the current operation token. */
export class PendingAffordance {
  private current=0;
  private busyBefore:string|null=null;
  private disabledBefore:string|null=null;
  private readonly buttons=new Map<HTMLButtonElement|HTMLInputElement,boolean>();
  constructor(private readonly host:Element){}
  begin(token:number):()=>void {
    if(this.current===0){this.busyBefore=this.host.getAttribute('aria-busy');this.disabledBefore=this.host.getAttribute('aria-disabled');this.buttons.clear();}
    this.current=token;
    this.host.setAttribute('aria-busy','true');
    if(this.host instanceof HTMLFormElement){for(const item of Array.from(this.host.elements)){if(!(item instanceof HTMLButtonElement||item instanceof HTMLInputElement)||!['submit','image'].includes(item.type))continue;if(!this.buttons.has(item))this.buttons.set(item,item.disabled);item.disabled=true;}}
    else this.host.setAttribute('aria-disabled','true');
    let done=false;
    return()=>{if(done||this.current!==token)return;done=true;this.current=0;if(this.busyBefore===null){if(this.host.getAttribute('aria-busy')==='true')this.host.removeAttribute('aria-busy');}else if(this.host.getAttribute('aria-busy')==='true')this.host.setAttribute('aria-busy',this.busyBefore);
      for(const [button,disabled] of this.buttons)if(button.disabled)button.disabled=disabled;this.buttons.clear();if(!(this.host instanceof HTMLFormElement)){if(this.disabledBefore===null){if(this.host.getAttribute('aria-disabled')==='true')this.host.removeAttribute('aria-disabled');}else if(this.host.getAttribute('aria-disabled')==='true')this.host.setAttribute('aria-disabled',this.disabledBefore);}};
  }
}
