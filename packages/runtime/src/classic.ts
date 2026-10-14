import { PlainUI } from './index.js';

const host = globalThis as typeof globalThis & { PlainUI?: typeof PlainUI };
if (host.PlainUI) throw new Error('PlainUI core is already loaded');
host.PlainUI = PlainUI;
function boot():void {
  const roots=[...document.querySelectorAll('[ui-app],[data-ui-app]')];
  const names=new Set<string>();
  for(const root of roots){const name=(root.getAttribute('ui-app')??root.getAttribute('data-ui-app')??'').trim();if(!name||names.has(name)||roots.some(other=>other!==root&&other.contains(root)))throw new Error('PlainUI classic root is invalid');names.add(name);}
  for(const root of roots)PlainUI.mount(root);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else queueMicrotask(boot);
