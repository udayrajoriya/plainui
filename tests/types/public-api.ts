import type {PlainUIApp,ScopeApi,ReadonlyJson,ResourceRecord} from '../../packages/runtime/src/esm.js';
import type {App} from '../../packages/core/src/app.js';

declare const app:App;
declare const scope:ScopeApi;
const publicApp:PlainUIApp=app;
const value:ReadonlyJson=publicApp.get('count');
const local:ReadonlyJson=scope.get('count');
const stop:()=>void=scope.afterFlush(()=>{});
const record:ResourceRecord={status:'idle',data:null,error:null,stale:false};
publicApp.registerCommand('test',({scope})=>scope.set('count',2));
publicApp.registerFormatter('twice',value=>value);
publicApp.registerBehavior('widget',(_element,_options,scope,signal)=>{if(!signal.aborted)scope.afterFlush(()=>{});});
publicApp.registerAdapter('custom',{version:'1',success:body=>body});
const unregister=publicApp.beforeNavigate(async url=>url.startsWith('/'));
const unsubscribe=publicApp.onDiagnostic(diagnostic=>{void diagnostic.code;});
const next:Promise<unknown>=publicApp.refresh('users');
void [unregister,unsubscribe,next];
void [value,local,stop,record];
// @ts-expect-error get snapshots cannot be mutated through public types.
(value as readonly number[]).push(1);
// @ts-expect-error nested JSON objects are readonly too.
(value as {items:readonly number[]}).items.push(1);
// @ts-expect-error resources expose only documented status values.
const invalid:ResourceRecord={status:'loading',data:null,error:null,stale:false};
void invalid;
