import {PlainUIError,type BehaviorFactory,type ReadonlyJson} from '@plainui/runtime-bridge';
import {validateBehaviorOptions} from '../../schema/src/index.js';

type Activation='manual'|'automatic';
type Orientation='horizontal'|'vertical';
type Options={activation:Activation;orientation:Orientation};
const widgetSelector='[ui-use~="tabs"],[data-ui-use~="tabs"]';
const managedAttributes=['tabindex','aria-selected','hidden','aria-orientation'] as const;
function invalid():PlainUIError{return new PlainUIError('UI_INVALID');}
function enabled(tab:HTMLButtonElement):boolean{return !tab.disabled&&tab.getAttribute('aria-disabled')!=='true';}

export class TabsController {
  private readonly originals=new Map<Element,Map<string,string|null>>();
  private tabs:HTMLButtonElement[]=[];private panels:HTMLElement[]=[];private active:HTMLButtonElement|null=null;private roving:HTMLButtonElement|null=null;private tablist:HTMLElement|null=null;private observer:MutationObserver|null=null;private disposed=false;
  constructor(private readonly host:Element,input:ReadonlyJson={},private readonly diagnose:(error:unknown)=>void=()=>{}) {
    if(validateBehaviorOptions('tabs',input).length)throw invalid();
    const source=input as Readonly<Record<string,ReadonlyJson>>;this.options={activation:(source.activation as Activation|undefined)??'manual',orientation:(source.orientation as Orientation|undefined)??'horizontal'};
    this.reconcile(true);host.addEventListener('click',this.onClick);host.addEventListener('keydown',this.onKeydown);
    const view=host.ownerDocument.defaultView;if(view){this.observer=new view.MutationObserver(()=>{try{this.reconcile(false);}catch(error){this.diagnose(error);}});this.observer.observe(host,{childList:true,subtree:true,attributes:true,attributeFilter:['disabled','aria-disabled']});}
  }
  private readonly options:Options;
  private owned(element:Element):boolean{return element.closest(widgetSelector)===this.host;}
  private remember(element:Element,attribute:typeof managedAttributes[number]):void {let record=this.originals.get(element);if(!record){record=new Map();this.originals.set(element,record);}if(!record.has(attribute))record.set(attribute,element.getAttribute(attribute));}
  private write(element:Element,attribute:typeof managedAttributes[number],value:string|null):void {this.remember(element,attribute);if(value===null)element.removeAttribute(attribute);else element.setAttribute(attribute,value);}
  private scan():{tablist:HTMLElement;tabs:HTMLButtonElement[];panels:HTMLElement[]} {
    const lists=[...this.host.querySelectorAll<HTMLElement>('[role="tablist"]')].filter(item=>this.owned(item));if(lists.length!==1)throw invalid();const tablist=lists[0]!;
    const candidates=[...tablist.querySelectorAll<HTMLElement>('[role="tab"]')].filter(item=>this.owned(item));if(!candidates.length||candidates.some(item=>!(item instanceof HTMLButtonElement)))throw invalid();const tabs=candidates as HTMLButtonElement[];
    const ids=new Set<string>(),panels:HTMLElement[]=[];
    for(const tab of tabs){const id=tab.id.trim(),controlled=tab.getAttribute('aria-controls')?.trim();if(!id||!controlled||ids.has(id))throw invalid();ids.add(id);const matches=[...this.host.querySelectorAll<HTMLElement>('[role="tabpanel"]')].filter(panel=>this.owned(panel)&&panel.id===controlled);if(matches.length!==1||panels.includes(matches[0]!))throw invalid();const panel=matches[0]!;if(panel.getAttribute('aria-labelledby')?.trim()!==id)throw invalid();panels.push(panel);}
    const ownedPanels=[...this.host.querySelectorAll<HTMLElement>('[role="tabpanel"]')].filter(panel=>this.owned(panel));if(ownedPanels.length!==panels.length)throw invalid();return {tablist,tabs,panels};
  }
  private reconcile(initial:boolean):void {
    if(this.disposed)return;const previousTabs=this.tabs,previousActive=this.active,previousIndex=previousActive?previousTabs.indexOf(previousActive):-1,{tablist,tabs,panels}=this.scan();this.tablist=tablist;this.tabs=tabs;this.panels=panels;this.write(tablist,'aria-orientation',this.options.orientation);
    if(initial){const selected=tabs.filter(tab=>enabled(tab)&&tab.getAttribute('aria-selected')==='true');if(selected.length>1)this.diagnose(invalid());this.active=selected[0]??tabs.find(enabled)??null;this.roving=this.active;}
    else if(!this.active||!tabs.includes(this.active)||!enabled(this.active)){const next=previousIndex<0?undefined:tabs.slice(Math.min(previousIndex,tabs.length)).find(enabled);const prior=previousIndex<0?undefined:[...tabs.slice(0,Math.min(previousIndex,tabs.length))].reverse().find(enabled);this.active=next??prior??tabs.find(enabled)??null;if(!this.roving||!tabs.includes(this.roving)||!enabled(this.roving))this.roving=this.active;}
    this.apply();
  }
  private apply():void {for(let index=0;index<this.tabs.length;index++){const tab=this.tabs[index]!,panel=this.panels[index]!;this.write(tab,'tabindex',tab===this.roving&&enabled(tab)?'0':'-1');this.write(tab,'aria-selected',tab===this.active?'true':'false');this.write(panel,'hidden',tab===this.active?null:'');}}
  private activate(tab:HTMLButtonElement):void {if(!enabled(tab))return;this.active=tab;this.roving=tab;this.apply();}
  private move(tab:HTMLButtonElement):void {if(!enabled(tab))return;this.roving=tab;this.apply();tab.focus();if(this.options.activation==='automatic')this.activate(tab);}
  private readonly onClick=(event:Event):void=>{const target=event.target;if(!(target instanceof Element))return;const tab=target.closest<HTMLButtonElement>('[role="tab"]');if(!tab||!this.tabs.includes(tab)||!enabled(tab))return;this.activate(tab);};
  private readonly onKeydown=(input:Event):void=>{const event=input as KeyboardEvent,target=event.target;if(!(target instanceof HTMLButtonElement)||!this.tabs.includes(target)||!enabled(target))return;const enabledTabs=this.tabs.filter(enabled);if(!enabledTabs.length)return;const index=enabledTabs.indexOf(target),rtl=this.host.ownerDocument.defaultView!.getComputedStyle(this.tablist!).direction==='rtl';let destination:HTMLButtonElement|undefined;
    if(event.key==='Home')destination=enabledTabs[0];else if(event.key==='End')destination=enabledTabs.at(-1);else if(this.options.orientation==='horizontal'&&(event.key==='ArrowLeft'||event.key==='ArrowRight')){const delta=(event.key==='ArrowRight')!==rtl?1:-1;destination=enabledTabs[(index+delta+enabledTabs.length)%enabledTabs.length];}else if(this.options.orientation==='vertical'&&(event.key==='ArrowUp'||event.key==='ArrowDown')){const delta=event.key==='ArrowDown'?1:-1;destination=enabledTabs[(index+delta+enabledTabs.length)%enabledTabs.length];}else if(this.options.activation==='manual'&&(event.key==='Enter'||event.key===' ')){event.preventDefault();this.activate(target);return;}else return;event.preventDefault();this.move(destination!);};
  dispose():void {if(this.disposed)return;this.disposed=true;this.observer?.disconnect();this.host.removeEventListener('click',this.onClick);this.host.removeEventListener('keydown',this.onKeydown);for(const [element,attributes] of this.originals)for(const [name,value] of attributes)value===null?element.removeAttribute(name):element.setAttribute(name,value);this.originals.clear();this.tabs=[];this.panels=[];this.active=null;this.roving=null;this.tablist=null;}
}

export const tabsBehavior:BehaviorFactory=(element,options,scope)=>{const controller=new TabsController(element,options,error=>{scope.afterFlush(()=>{throw error;});});return()=>controller.dispose();};
