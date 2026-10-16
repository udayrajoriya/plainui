import {PlainUIError} from '../../core/src/index.js';
import type {App} from '../../core/src/app.js';
import type {ModuleRuntime} from '../../core/src/integration.js';
import type {ResolvedOptions} from '../../core/src/config.js';
import {parseLocation} from './location.js';
import {compileRoutes,selectRoute,type RouteMatch} from './match.js';
import {installLinkDelegation} from './links.js';
import {navigationKind,nativeNavigate} from './native-navigation.js';
import {NavigationPreparer} from './navigation/prepare.js';
import {HistoryIndex} from './history/index.js';
import {HistoryTraversal} from './history/traverse.js';

const ownerSymbol=Symbol.for('plainui.document.router-owner.v1');
type RouterDocument=Document&{[ownerSymbol]?:RouterController};

export class RouterController implements ModuleRuntime {
  private root:Element|null=null;private options:ResolvedOptions|null=null;private declarations:ReturnType<typeof compileRoutes>=[];private outlet:Element|null=null;private releaseLinks:(()=>void)|null=null;private preparer:NavigationPreparer|null=null;private historyIndex:HistoryIndex|null=null;private traversal:HistoryTraversal|null=null;private active=false;current:RouteMatch|null=null;
  readonly navigation={beforeNavigate:(guard:(url:string)=>boolean|Promise<boolean>)=>{if(!this.preparer)throw new PlainUIError('OWNER_DISPOSED');return this.preparer.before(context=>guard(context.to.path));},navigate:(url:string)=>this.navigate(url)};
  constructor(private readonly app:App){}
  mount(root:Element,options:ResolvedOptions):void {const document=root.ownerDocument as RouterDocument;if(document[ownerSymbol]&&document[ownerSymbol]!==this)throw new PlainUIError('ROUTER_DOCUMENT_OWNER');this.root=root;this.options=options;this.declarations=compileRoutes(root);this.outlet=root.querySelector('[ui-outlet],[data-ui-outlet]');const view=root.ownerDocument.defaultView!;this.preparer=new NavigationPreparer(url=>selectRoute(this.declarations,parseLocation(url,view.location.href,options.router.mode,options.router.basePath)),()=>{});document[ownerSymbol]=this;this.active=true;this.releaseLinks=installLinkDelegation(root,options.router.basePath,url=>{void this.navigate(url.href);});const location=parseLocation(view.location.href,root.ownerDocument.baseURI,options.router.mode,options.router.basePath);this.current=selectRoute(this.declarations,location);this.historyIndex=new HistoryIndex(view);this.traversal=new HistoryTraversal(view,this.historyIndex,{accept:async(url)=>{if(!this.preparer)return false;const transaction=await this.preparer.prepare(url,this.current?.route??null,'traverse');if(!transaction||!this.preparer.isCurrent(transaction))return false;this.current=transaction.match;this.render(transaction.match);return true;},unknown:url=>nativeNavigate(view,url)},options.router.mode==='hash');this.traversal.start(this.current.declaration.pattern.path);void this.app.ready.then(()=>{if(this.active&&this.current)this.render(this.current);});}
  private render(match:RouteMatch):void {if(!this.outlet?.isConnected)return;this.outlet.replaceChildren(match.declaration.template.content.cloneNode(true));}
  async navigate(input:string):Promise<void> {if(!this.active||!this.root||!this.options||!this.preparer||!this.historyIndex)throw new PlainUIError('OWNER_DISPOSED');const view=this.root.ownerDocument.defaultView!,decision=navigationKind(input,view.location.href,this.options.router.basePath);if(decision.kind==='document'){nativeNavigate(view,decision.url);return;}const transaction=await this.preparer.prepare(decision.url,this.current?.route??null);if(!transaction||!this.preparer.isCurrent(transaction))return;if(!this.historyIndex.push(decision.url,transaction.match.declaration.pattern.path))return;this.current=transaction.match;this.render(transaction.match);}
  unmount():void {if(!this.active)return;this.active=false;this.releaseLinks?.();this.releaseLinks=null;this.traversal?.stop();this.traversal=null;this.historyIndex=null;this.preparer?.dispose();this.preparer=null;const document=this.root?.ownerDocument as RouterDocument|undefined;if(document?.[ownerSymbol]===this)delete document[ownerSymbol];this.root=null;this.outlet=null;this.current=null;}
}

export function installRouterRuntime(app:App):void {app.installModuleRuntime(new RouterController(app));}
