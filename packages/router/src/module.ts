import {PlainUIError} from '../../core/src/index.js';
import type {App} from '../../core/src/app.js';
import type {ModuleRuntime} from '../../core/src/integration.js';
import type {ResolvedOptions} from '../../core/src/config.js';
import type {RouteRecord} from '../../core/src/public-api/types.js';
import {parseLocation} from './location.js';
import {compileRoutes,selectRoute,type RouteMatch} from './match.js';
import {installLinkDelegation} from './links.js';
import {navigationKind,nativeNavigate} from './native-navigation.js';
import {NavigationPreparer} from './navigation/prepare.js';
import {HistoryIndex} from './history/index.js';
import {HistoryTraversal} from './history/traverse.js';
import {RouteView} from './view.js';
import {commitNavigation} from './navigation/commit.js';
import {applyRouteTitle} from './title.js';
import {RoutePostFlushEffects} from './scroll.js';

const ownerSymbol=Symbol.for('plainui.document.router-owner.v1');
type RouterDocument=Document&{[ownerSymbol]?:RouterController};

export class RouterController implements ModuleRuntime {
  private root:Element|null=null;private options:ResolvedOptions|null=null;private declarations:ReturnType<typeof compileRoutes>=[];private outlet:Element|null=null;private view:RouteView<{route:RouteRecord}>|null=null;private effects:RoutePostFlushEffects|null=null;private releaseLinks:(()=>void)|null=null;private preparer:NavigationPreparer|null=null;private historyIndex:HistoryIndex|null=null;private traversal:HistoryTraversal|null=null;private active=false;current:RouteMatch|null=null;
  readonly navigation={beforeNavigate:(guard:(url:string)=>boolean|Promise<boolean>)=>{if(!this.preparer)throw new PlainUIError('OWNER_DISPOSED');return this.preparer.before(context=>guard(context.to.path));},navigate:(url:string)=>this.navigate(url)};
  constructor(private readonly app:App){}
  mount(root:Element,options:ResolvedOptions):void {const document=root.ownerDocument as RouterDocument;if(document[ownerSymbol]&&document[ownerSymbol]!==this)throw new PlainUIError('ROUTER_DOCUMENT_OWNER');this.root=root;this.options=options;this.declarations=compileRoutes(root);this.outlet=root.querySelector('[ui-outlet],[data-ui-outlet]');this.view=new RouteView(this.outlet!,{createScope:route=>({route}),publish:()=>{},activate:()=>{}});this.effects=new RoutePostFlushEffects();const view=root.ownerDocument.defaultView!;this.preparer=new NavigationPreparer(url=>selectRoute(this.declarations,parseLocation(url,view.location.href,options.router.mode,options.router.basePath)),()=>{});document[ownerSymbol]=this;this.active=true;this.releaseLinks=installLinkDelegation(root,options.router.basePath,url=>{void this.navigate(url.href);});const location=parseLocation(view.location.href,root.ownerDocument.baseURI,options.router.mode,options.router.basePath);this.current=selectRoute(this.declarations,location);this.historyIndex=new HistoryIndex(view);this.traversal=new HistoryTraversal(view,this.historyIndex,{accept:async(url,state)=>{if(!this.preparer||!this.view)return false;const transaction=await this.preparer.prepare(url,this.current?.route??null,'traverse');if(!transaction||!this.preparer.isCurrent(transaction))return false;this.view.commit(this.view.prepare(transaction.match));this.afterCommit(transaction.match,state.scroll);this.current=transaction.match;return true;},unknown:url=>nativeNavigate(view,url)},options.router.mode==='hash');this.traversal.start(this.current.declaration.pattern.path);void this.app.ready.then(()=>{if(this.active&&this.current&&this.view){this.view.commit(this.view.prepare(this.current));this.afterCommit(this.current,null);}});}
  private afterCommit(match:RouteMatch,position:readonly [number,number]|null):void {if(!this.outlet||!this.options)return;applyRouteTitle(match.declaration.template,match.route,this.options.locale,this.options.timeZone);this.effects?.schedule(this.outlet,match.route.hash,position);}
  async navigate(input:string):Promise<void> {if(!this.active||!this.root||!this.options||!this.preparer||!this.historyIndex||!this.view)throw new PlainUIError('OWNER_DISPOSED');const browser=this.root.ownerDocument.defaultView!,decision=navigationKind(input,browser.location.href,this.options.router.basePath);if(decision.kind==='document'){nativeNavigate(browser,decision.url);return;}const transaction=await this.preparer.prepare(decision.url,this.current?.route??null);if(!transaction)return;const scope=commitNavigation(this.preparer,transaction,this.view,{live:()=>this.active,writeHistory:item=>this.historyIndex!.push(item.url,item.match.declaration.pattern.path)});if(scope){this.current=transaction.match;this.afterCommit(transaction.match,null);}}
  unmount():void {if(!this.active)return;this.active=false;this.releaseLinks?.();this.releaseLinks=null;this.traversal?.stop();this.traversal=null;this.historyIndex=null;this.preparer?.dispose();this.preparer=null;this.effects?.dispose();this.effects=null;this.view?.dispose();this.view=null;const document=this.root?.ownerDocument as RouterDocument|undefined;if(document?.[ownerSymbol]===this)delete document[ownerSymbol];this.root=null;this.outlet=null;this.current=null;}
}

export function installRouterRuntime(app:App):void {app.installModuleRuntime(new RouterController(app));}
