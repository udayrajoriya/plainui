import {PlainUIError} from '@plainui/runtime-bridge';

interface DialogRecord {readonly dialog:HTMLDialogElement;opener:HTMLElement|null;readonly close:()=>void}
function fail():never {throw new PlainUIError('UI_INVALID');}
function focusable(element:HTMLElement):boolean {return element.isConnected&&!element.matches(':disabled,[hidden],[inert]')&&(element.tabIndex>=0||element.matches('a[href],button,input,select,textarea'))}
function hasAccessibleName(dialog:HTMLDialogElement):boolean {if(dialog.getAttribute('aria-label')?.trim())return true;const source=dialog.getAttribute('aria-labelledby')?.trim();if(!source)return false;const ids=source.split(/\s+/u);return ids.length>0&&ids.every(id=>Boolean(dialog.ownerDocument.getElementById(id)))&&ids.map(id=>dialog.ownerDocument.getElementById(id)?.textContent?.trim()??'').join(' ').trim().length>0;}

export class DialogController {
  private readonly records=new Map<HTMLDialogElement,DialogRecord>();private disposed=false;
  constructor(private readonly root:Element) {}
  private resolve(target:Element|undefined):HTMLDialogElement {if(this.disposed)throw new PlainUIError('OWNER_DISPOSED');const view=this.root.ownerDocument.defaultView;if(!target||!view||!(target instanceof view.HTMLDialogElement)||!target.isConnected||!this.root.contains(target)||typeof target.showModal!=='function'||!hasAccessibleName(target))fail();return target;}
  open(target:Element|undefined):void {const dialog=this.resolve(target);if(dialog.open)return;const active=dialog.ownerDocument.activeElement,opener=active instanceof HTMLElement&&active.isConnected?active:null;let record=this.records.get(dialog);if(!record){const close=()=>{const current=this.records.get(dialog);if(!current)return;const restore=current.opener;current.opener=null;if(!this.disposed&&restore&&focusable(restore))restore.focus({preventScroll:true});};dialog.addEventListener('close',close);record={dialog,opener:null,close};this.records.set(dialog,record);}record.opener=opener;try{dialog.showModal();}catch{record.opener=null;fail();}}
  close(target:Element|undefined):void {const dialog=this.resolve(target);if(dialog.open)dialog.close();}
  dispose():void {if(this.disposed)return;this.disposed=true;for(const record of this.records.values()){record.opener=null;record.dialog.removeEventListener('close',record.close);if(record.dialog.open)record.dialog.close();}this.records.clear();}
}
