import {fieldControls,fieldPresenters} from './index.js';
import {AriaFieldOwnership} from './aria.js';

let nextId=0;
function uniqueId(document:Document):string {let id:string;do{id=`plainui-field-error-${++nextId}`;}while(document.getElementById(id));return id;}

export class FormErrorPresenter {
  private readonly presenters=new Map<string,Element[]>();
  private readonly aria=new Map<string,AriaFieldOwnership>();
  private readonly listeners=new Map<Element,()=>void>();
  private readonly ownedText=new Map<Element,string>();
  private readonly generatedIds=new Map<Element,string>();
  private readonly timers=new Set<ReturnType<typeof setTimeout>>();
  private readonly resetListener=(event:Event)=>{const timer=setTimeout(()=>{this.timers.delete(timer);if(!event.defaultPrevented){this.clear();this.resetFields();}},0);this.timers.add(timer);};
  constructor(private readonly form:HTMLFormElement,private readonly edited:(name:string)=>void,private readonly resetFields:()=>void){for(const presenter of fieldPresenters(form)){if(!presenter.name)continue;const list=this.presenters.get(presenter.name)??[];list.push(presenter.element);this.presenters.set(presenter.name,list);if(!presenter.element.id){const id=uniqueId(form.ownerDocument);presenter.element.id=id;this.generatedIds.set(presenter.element,id);}}form.addEventListener('reset',this.resetListener);}
  show(fields:Readonly<Record<string,readonly string[]>>):void {this.clear();for(const [name,messages] of Object.entries(fields)){const presenters=this.presenters.get(name);if(!presenters?.length||!messages.length)continue;const controls=fieldControls(this.form,name);const owned=new AriaFieldOwnership();this.aria.set(name,owned);for(const presenter of presenters){presenter.textContent=messages[0]!;this.ownedText.set(presenter,messages[0]!);for(const control of controls)owned.apply(control,presenter.id);}for(const control of controls){const listener=()=>{this.clearField(name);this.edited(name);};control.addEventListener('input',listener);control.addEventListener('change',listener);this.listeners.set(control,()=>{control.removeEventListener('input',listener);control.removeEventListener('change',listener);});}}}
  clearField(name:string):void {for(const element of this.presenters.get(name)??[]){const owned=this.ownedText.get(element);if(owned!==undefined&&element.textContent===owned)element.textContent='';this.ownedText.delete(element);}this.aria.get(name)?.clear();this.aria.delete(name);for(const control of fieldControls(this.form,name)){this.listeners.get(control)?.();this.listeners.delete(control);}}
  clear():void {for(const name of this.presenters.keys())this.clearField(name);}
  dispose():void {this.clear();this.form.removeEventListener('reset',this.resetListener);for(const timer of this.timers)clearTimeout(timer);this.timers.clear();for(const [element,id] of this.generatedIds)if(element.id===id)element.removeAttribute('id');this.generatedIds.clear();}
}
