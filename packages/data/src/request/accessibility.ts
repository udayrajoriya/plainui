interface BusyClaim {count:number;before:string|null}
const busy=new WeakMap<Element,BusyClaim>();

/** Counts concurrent request claims on a region and restores only its owned aria-busy value. */
export function beginBusy(region:Element):()=>void {
  let claim=busy.get(region);if(!claim){claim={count:0,before:region.getAttribute('aria-busy')};busy.set(region,claim);}
  claim.count++;region.setAttribute('aria-busy','true');let released=false;
  return ()=>{if(released)return;released=true;claim!.count--;if(claim!.count>0)return;busy.delete(region);if(region.getAttribute('aria-busy')!=='true')return;if(claim!.before===null)region.removeAttribute('aria-busy');else region.setAttribute('aria-busy',claim!.before);};
}
