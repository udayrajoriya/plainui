import {PlainUIError} from '@plainui/runtime-bridge';
import {validateBehaviorOptions} from '../../schema/src/index.js';

const DEFAULT_DURATION=5000;
const MAX_VISIBLE=5;
const selector='[ui-toasts],[data-ui-toasts]';
let nextToastId=0;

interface ToastRecord {
  readonly id:number;
  readonly element:HTMLLIElement;
  readonly dismiss:()=>void;
  readonly pause:()=>void;
  readonly resume:()=>void;
  remaining:number;
  startedAt:number;
  timer:number|null;
}

function invalid():never {throw new PlainUIError('UI_INVALID');}
function messageText(value:unknown):string|null {
  if(value===null||value===undefined)return null;
  if(typeof value==='object'||typeof value==='function'||typeof value==='symbol')invalid();
  const text=String(value);
  return text.length?text:null;
}

export class ToastController {
  private region:HTMLElement|null=null;
  private list:HTMLOListElement|null=null;
  private announcer:HTMLElement|null=null;
  private createdRegion=false;
  private duration=DEFAULT_DURATION;
  private readonly records:ToastRecord[]=[];
  private disposed=false;
  constructor(private readonly root:Element){this.findAuthoredRegion();}
  private findAuthoredRegion():void {
    const regions=[...this.root.querySelectorAll<HTMLElement>(selector)];
    if(this.root.matches(selector))regions.unshift(this.root as HTMLElement);
    if(regions.length>1)invalid();
    const region=regions[0];if(!region)return;
    if(region.hasAttribute('ui-toasts')===region.hasAttribute('data-ui-toasts'))invalid();
    const flag=region.getAttribute('ui-toasts')??region.getAttribute('data-ui-toasts');
    if(flag!==''||region.hasAttribute('ui-use')||region.hasAttribute('data-ui-use'))invalid();
    const raw=region.getAttribute('ui-options')??region.getAttribute('data-ui-options');
    let options:unknown={};
    if(raw!==null){try{options=JSON.parse(raw);}catch{invalid();}}
    if(validateBehaviorOptions('toasts',options).length)invalid();
    this.duration=(options as {toastDurationMs?:number}).toastDurationMs??DEFAULT_DURATION;
    this.region=region;
  }
  private ensureRegion():void {
    if(this.region&&this.list&&this.announcer)return;
    const document=this.root.ownerDocument;
    if(!this.region){this.region=document.createElement('section');this.region.setAttribute('data-ui-toast-region','');this.root.append(this.region);this.createdRegion=true;}
    this.region.setAttribute('aria-live','polite');
    this.region.setAttribute('aria-atomic','false');
    this.announcer=document.createElement('div');
    this.announcer.setAttribute('role','status');
    this.announcer.setAttribute('aria-live','polite');
    this.announcer.setAttribute('aria-atomic','true');
    this.announcer.setAttribute('data-ui-toast-announcer','');
    this.list=document.createElement('ol');
    this.list.setAttribute('aria-live','off');
    this.list.setAttribute('data-ui-toast-list','');
    this.region.append(this.announcer,this.list);
  }
  toast(value:unknown):void {
    if(this.disposed)throw new PlainUIError('OWNER_DISPOSED');
    const text=messageText(value);if(text===null)return;
    this.ensureRegion();
    const document=this.root.ownerDocument,id=++nextToastId,item=document.createElement('li'),message=document.createElement('span'),button=document.createElement('button');
    item.setAttribute('data-ui-toast-owner',String(id));message.textContent=text;button.type='button';button.textContent='Dismiss';button.setAttribute('aria-label','Dismiss notification');item.append(message,button);this.list!.append(item);
    const record:ToastRecord={id,element:item,remaining:this.duration,startedAt:0,timer:null,dismiss:()=>this.remove(id),pause:()=>this.pause(id),resume:()=>this.resume(id)};
    button.addEventListener('click',record.dismiss);item.addEventListener('mouseenter',record.pause);item.addEventListener('mouseleave',record.resume);item.addEventListener('focusin',record.pause);item.addEventListener('focusout',record.resume);this.records.push(record);
    this.announcer!.textContent='';this.announcer!.append(document.createTextNode(text));
    if(this.duration>0)this.start(record);
    while(this.records.length>MAX_VISIBLE)this.remove(this.records[0]!.id);
  }
  private start(record:ToastRecord):void {if(record.remaining<=0){this.remove(record.id);return;}record.startedAt=performance.now();record.timer=this.root.ownerDocument.defaultView!.setTimeout(record.dismiss,record.remaining);}
  private pause(id:number):void {const record=this.records.find(item=>item.id===id);if(!record||record.timer===null)return;this.root.ownerDocument.defaultView!.clearTimeout(record.timer);record.timer=null;record.remaining=Math.max(0,record.remaining-(performance.now()-record.startedAt));}
  private resume(id:number):void {const record=this.records.find(item=>item.id===id);if(!record||record.timer!==null||record.remaining<=0)return;const active=record.element.ownerDocument.activeElement;if(record.element.matches(':hover')||active instanceof Node&&record.element.contains(active))return;this.start(record);}
  private remove(id:number):void {const index=this.records.findIndex(item=>item.id===id);if(index<0)return;const [record]=this.records.splice(index,1);if(record!.timer!==null)this.root.ownerDocument.defaultView!.clearTimeout(record!.timer);record!.element.removeEventListener('mouseenter',record!.pause);record!.element.removeEventListener('mouseleave',record!.resume);record!.element.removeEventListener('focusin',record!.pause);record!.element.removeEventListener('focusout',record!.resume);record!.element.querySelector('button')?.removeEventListener('click',record!.dismiss);record!.element.remove();}
  dispose():void {if(this.disposed)return;this.disposed=true;for(const record of [...this.records])this.remove(record.id);this.announcer?.remove();this.list?.remove();if(this.createdRegion)this.region?.remove();this.announcer=null;this.list=null;this.region=null;}
}
