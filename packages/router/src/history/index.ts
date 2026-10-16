import {historyState,mergeHistoryState,type RouterHistoryState} from './state.js';

let sessionSerial=1;
export class HistoryIndex {
  readonly rootSession=`r${sessionSerial++}`;index=0;
  constructor(private readonly view:Window){}
  adopt(routeKey:string):RouterHistoryState {const existing=historyState(this.view.history.state),index=existing?.index??0;this.index=index;const state={rootSession:this.rootSession,index,routeKey,scroll:[this.view.scrollX,this.view.scrollY] as const};this.view.history.replaceState(mergeHistoryState(this.view.history.state,state),'',this.view.location.href);return state;}
  saveScroll(routeKey:string):void {const current=historyState(this.view.history.state);const state={rootSession:this.rootSession,index:this.index,routeKey:current?.routeKey??routeKey,scroll:[this.view.scrollX,this.view.scrollY] as const};this.view.history.replaceState(mergeHistoryState(this.view.history.state,state),'',this.view.location.href);}
  push(url:URL,routeKey:string):boolean {if(url.href===this.view.location.href)return false;this.saveScroll(routeKey);const state={rootSession:this.rootSession,index:++this.index,routeKey,scroll:[0,0] as const};this.view.history.pushState(mergeHistoryState({},state),'',url.href);return true;}
  accept(index:number):void {this.index=index;}
  owned(value:unknown):RouterHistoryState|null {const state=historyState(value);return state?.rootSession===this.rootSession?state:null;}
}
