export type SafeSpan={start:number;end:number};
export function safeDirective(value:string|undefined):string|undefined { return value && /^(?:data-)?ui-[a-z0-9:.*-]+$/.test(value) ? value : undefined; }
export function safeSpan(value:SafeSpan|undefined):SafeSpan|undefined { return value && Number.isSafeInteger(value.start) && Number.isSafeInteger(value.end) && value.start>=0 && value.end>=value.start ? {start:value.start,end:value.end} : undefined; }
export function safeUrlLocation(value:string):string {
  try { const url=new URL(value);return url.origin; }
  catch { return value.split(/[?#]/,1)[0]??''; }
}
export function elementLocation(root:Element,element:Element,directive?:string):string {
  if (root===element) return directive?`root/@${safeDirective(directive)??'ui-unknown'}`:'root';
  const parts:string[]=[];let current:Element|null=element;
  while(current && current!==root){const parent:Element|null=current.parentElement;if(!parent)return 'detached';const siblings=[...parent.children].filter(sibling=>sibling.localName===current!.localName);parts.push(`${current.localName}:nth-of-type(${siblings.indexOf(current)+1})`);current=parent;}
  if(current!==root)return 'outside-root';
  return `root/${parts.reverse().join('/')}${directive?`/@${safeDirective(directive)??'ui-unknown'}`:''}`;
}
