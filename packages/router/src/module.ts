import {PlainUIError} from '../../core/src/index.js';
import type {App} from '../../core/src/app.js';
import type {ModuleRuntime} from '../../core/src/integration.js';
import type {ResolvedOptions} from '../../core/src/config.js';
import {parseLocation} from './location.js';
import {compileRoutes,selectRoute,type RouteMatch} from './match.js';
import {installLinkDelegation} from './links.js';
import {navigationKind,nativeNavigate} from './native-navigation.js';
import {NavigationPreparer} from './navigation/prepare.js';

const ownerSymbol=Symbol.for('plainui.document.router-owner.v1');
type RouterDocument=Document&{[ownerSymbol]?:RouterController};

export class RouterController implements ModuleRuntime {
  private root:Element|null=null;private options:ResolvedOptions|null=null;private declarations:ReturnType<typeof compileRoutes>=[];private outlet:Element|null=null;private releaseLinks:(()=>void)|null=null;private preparer:NavigationPreparer|null=null;private active=false;current:RouteMatch|null=null;
  readonly navigation={beforeNavigate:(guard:(url:string)=>boolean|Promise<boolean>)=>{if(!this.preparer)throw new PlainUIError('OWNER_DISPOSED');return this.preparer.before(context=>guard(context.to.path));},navigate:(url:string)=>this.navigate(url)};
  constructor(private readonly app:App){}
  mount(root:Element,options:ResolvedOptions):void {const document=root.ownerDocument as RouterDocument;if(document[ownerSymbol]&&document[ownerSymbol]!==this)throw new PlainUIError('ROUTER_DOCUMENT_OWNER');this.root=root;this.options=options;this.declarations=compileRoutes(root);this.outlet=root.querySelector('[ui-outlet],[data-ui-outlet]');this.preparer=new NavigationPreparer(url=>selectRoute(this.declarations,parseLocation(url,root.ownerDocument.defaultView!.location.href,options.router.mode,options.router.basePath)),()=>{});document[ownerSymbol]=this;this.active=true;this.releaseLinks=installLinkDelegation(root,options.router.basePath,url=>{void this.navigate(url.href);});const location=parseLocation(root.ownerDocument.defaultView!.location.href,root.ownerDocument.baseURI,options.router.mode,options.router.basePath);this.current=selectRoute(this.declarations,location);void this.app.ready.then(()=>{if(this.active&&this.current)this.render(this.current);});}
  private render(match:RouteMatch):void {if(!this.outlet?.isConnected)return;this.outlet.replaceChildren(match.declaration.template.content.cloneNode(true));}
  async navigate(input:string):Promise<void> {if(!this.active||!this.root||!this.options||!this.preparer)throw new PlainUIError('OWNER_DISPOSED');const view=this.root.ownerDocument.defaultView!,decision=navigationKind(input,view.location.href,this.options.router.basePath);if(decision.kind==='document'){nativeNavigate(view,decision.url);return;}const transaction=await this.preparer.prepare(decision.url,this.current?.route??null);if(!transaction||!this.preparer.isCurrent(transaction))return;view.history.pushState(view.history.state,'',decision.url.href);this.current=transaction.match;this.render(transaction.match);}
  unmount():void {if(!this.active)return;this.active=false;this.releaseLinks?.();this.releaseLinks=null;this.preparer?.dispose();this.preparer=null;const document=this.root?.ownerDocument as RouterDocument|undefined;if(document?.[ownerSymbol]===this)delete document[ownerSymbol];this.root=null;this.outlet=null;this.current=null;}
}

export function installRouterRuntime(app:App):void {app.installModuleRuntime(new RouterController(app));}
