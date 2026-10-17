import {PlainUI} from '/dist/plainui.mjs';
import {installRouter} from '/dist/plainui-router.mjs';
import {installFragments} from '/dist/plainui-fragments.mjs';

const alternate={version:'1',success(value){return value.payload;},error(error,value){return {kind:error.kind,status:error.status,code:value?.error?.type??error.code,message:value?.error?.detail??error.message,fields:Object.fromEntries((value?.error?.violations??[]).map(item=>[item.field,item.messages])),retryable:error.retryable,requestId:value?.trace??error.requestId};}};
const adapter=document.querySelector('meta[name="plainui-demo-adapter"]')?.content;
const app=PlainUI.create({debug:true,router:{mode:'history',basePath:'/'}});globalThis.blogDiagnostics=[];app.onDiagnostic(item=>globalThis.blogDiagnostics.push(item));
installRouter(app);installFragments(app);
app.registerAdapter('demo',adapter==='alternate'?alternate:{version:'1',success:value=>value,error:error=>error});
app.registerCommand('retryArticles',()=>app.refresh('articles'));
app.registerCommand('retryArticle',()=>app.refresh('article'));
app.registerCommand('searchArticles',()=>app.refresh('articles'));
app.registerCommand('selectArticle',(_context,id)=>app.set('selectedId',id));
const root=document.querySelector('[ui-app]'),deepLink=/^\/articles\/([^/]+)\/?$/u.exec(location.pathname);if(deepLink)root.setAttribute('ui-state',JSON.stringify({query:'',selectedId:decodeURIComponent(deepLink[1])}));app.mount(root);await app.ready;
document.querySelector('#server-content')?.setAttribute('hidden','');root.removeAttribute('hidden');
globalThis.blogApp=app;
