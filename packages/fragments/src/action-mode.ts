import {PlainUIError} from '../../core/src/index.js';

export type FragmentSwapMode='inner'|'outer'|'before'|'after'|'append'|'prepend';
export interface FragmentActionMode {readonly targetRef:string;readonly swap:FragmentSwapMode;readonly enhance:boolean}
const swaps=new Set<FragmentSwapMode>(['inner','outer','before','after','append','prepend']);
function fail():never {throw new PlainUIError('FRAGMENT_POLICY');}

export function compileFragmentAction(directives:Readonly<Record<string,string>>,rootAllowsEnhance=false):FragmentActionMode {
  if((directives['ui-response']??'json')!=='html')fail();
  const targetRef=directives['ui-target']?.trim();if(!targetRef)fail();
  const swap=(directives['ui-swap']??'inner') as FragmentSwapMode;if(!swaps.has(swap))fail();
  const source=directives['ui-enhance']??'false';if(source!=='true'&&source!=='false')fail();
  const enhance=source==='true';if(enhance&&!rootAllowsEnhance)fail();
  return Object.freeze({targetRef,swap,enhance});
}

export function assertResourceResponseMode(directives:Readonly<Record<string,string>>):void {if((directives['ui-response']??'json')==='html'||directives['ui-target']!==undefined||directives['ui-swap']!==undefined||directives['ui-enhance']!==undefined)fail();}

export function fragmentRequestHeaders(input:HeadersInit|undefined):Headers {const headers=new Headers(input);if(!headers.has('accept'))headers.set('accept','text/html');return headers;}
export async function readFragmentResponse(response:Response):Promise<string> {if(!response.ok||response.headers.get('content-type')?.split(';',1)[0]!.trim().toLowerCase()!=='text/html')throw new PlainUIError('FRAGMENT_POLICY');return response.text();}
