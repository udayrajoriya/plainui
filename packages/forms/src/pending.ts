/** Restores only attributes and button states changed by the current operation token. */
export class PendingAffordance {
  private current=0;
  private disabledBefore:string|null=null;
  private readonly buttons=new Map<HTMLButtonElement|HTMLInputElement,boolean>();
  constructor(private readonly host:Element,private readonly beginBusy:()=>()=>void=()=>{const before=host.getAttribute('aria-busy');host.setAttribute('aria-busy','true');return()=>{if(host.getAttribute('aria-busy')==='true'){if(before===null)host.removeAttribute('aria-busy');else host.setAttribute('aria-busy',before);}};}){}
  begin(token:number):()=>void {
    if(this.current===0){this.disabledBefore=this.host.getAttribute('aria-disabled');this.buttons.clear();}
    this.current=token;
    const releaseBusy=this.beginBusy();
    if(this.host instanceof HTMLFormElement){for(const item of Array.from(this.host.elements)){if(!(item instanceof HTMLButtonElement||item instanceof HTMLInputElement)||!['submit','image'].includes(item.type))continue;if(!this.buttons.has(item))this.buttons.set(item,item.disabled);item.disabled=true;}}
    else this.host.setAttribute('aria-disabled','true');
    let done=false;
    return()=>{if(done)return;done=true;releaseBusy();if(this.current!==token)return;this.current=0;
      for(const [button,disabled] of this.buttons)if(button.disabled)button.disabled=disabled;this.buttons.clear();if(!(this.host instanceof HTMLFormElement)){if(this.disabledBefore===null){if(this.host.getAttribute('aria-disabled')==='true')this.host.removeAttribute('aria-disabled');}else if(this.host.getAttribute('aria-disabled')==='true')this.host.setAttribute('aria-disabled',this.disabledBefore);}};
  }
}
