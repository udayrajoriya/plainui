import {evaluate,parseExpression,PlainUIError} from '../../../core/src/index.js';
import type {AstNode,EvaluationOptions,LexicalReader} from '../../../core/src/index.js';
import {applyQuery} from './query.js';

export type UrlSegment={readonly kind:'literal';readonly value:string}|{readonly kind:'expression';readonly source:string;readonly ast:AstNode};
export interface CompiledUrlTemplate {readonly source:string;readonly segments:readonly UrlSegment[]}
export interface ResolveUrlOptions {readonly mode:'request'|'navigation';readonly apiBaseUrl:string;readonly documentUrl:string;readonly allowedOrigins:readonly string[];readonly reader:LexicalReader;readonly evaluation:EvaluationOptions;readonly query?:unknown}
export type ResolvedUrl={readonly status:'ready';readonly url:URL}|{readonly status:'incomplete'};
function invalid():never {throw new PlainUIError('DIRECTIVE_VALUE');}
export function compileUrlTemplate(source:string):CompiledUrlTemplate {if(!source.trim())invalid();const segments:UrlSegment[]=[];let start=0;
  for(let index=0;index<source.length;index++){const char=source[index]!;if(char==='}')invalid();if(char!=='{')continue;if(index>start)segments.push({kind:'literal',value:source.slice(start,index)});const begin=index+1;const stack=['{'];let quote='';let escaped=false;
    for(index++;index<source.length;index++){const current=source[index]!;if(quote){if(escaped){escaped=false;continue;}if(current==='\\'){escaped=true;continue;}if(current===quote)quote='';continue;}if(current==='"'||current==="'"){quote=current;continue;}if('([{'.includes(current)){stack.push(current);continue;}if(')]}'.includes(current)){const opening=stack.pop();if(!opening||'([{'.indexOf(opening)!==')]}'.indexOf(current))invalid();if(!stack.length)break;}}
    if(stack.length||quote||index>=source.length)invalid();const expression=source.slice(begin,index).trim();if(!expression)invalid();let ast:AstNode;try{ast=parseExpression(expression);}catch{return invalid();}segments.push({kind:'expression',source:expression,ast});start=index+1;
  }
  if(start<source.length)segments.push({kind:'literal',value:source.slice(start)});return Object.freeze({source,segments:Object.freeze(segments)});
}
function sentinel(index:number,source:string):string {let candidate=`plainui_placeholder_${index}_`;while(source.includes(candidate))candidate+='x';return candidate;}
export function resolveUrlTemplate(template:CompiledUrlTemplate,options:ResolveUrlOptions):ResolvedUrl {const base=options.mode==='request'?options.apiBaseUrl:options.documentUrl;const placeholders=template.segments.filter(segment=>segment.kind==='expression').map((_,index)=>sentinel(index,template.source));let cursor=0;const probe=template.segments.map(segment=>segment.kind==='literal'?segment.value:placeholders[cursor++]!).join('');let staged:URL;
  const schemeDelimiter=probe.indexOf('://');const colon=probe.indexOf(':');const firstBoundary=probe.search(/[/?#]/);if(placeholders.some(marker=>schemeDelimiter>=0&&probe.slice(0,schemeDelimiter).includes(marker)||colon>=0&&(firstBoundary<0||colon<firstBoundary)&&probe.slice(0,colon).includes(marker)))throw new PlainUIError('URL_POLICY');
  try{staged=new URL(probe,base);}catch{throw new PlainUIError('URL_POLICY');}
  if(placeholders.some(marker=>[staged.protocol,staged.username,staged.password,staged.hostname,staged.port].some(part=>part.includes(marker))))throw new PlainUIError('URL_POLICY');
  const values:string[]=[];for(const segment of template.segments){if(segment.kind==='literal'){values.push(segment.value);continue;}const result=evaluate(segment.ast,options.reader,options.evaluation);if(!result.ok)throw new PlainUIError(result.code);if(result.value===null)return {status:'incomplete'};if(!['string','boolean','number'].includes(typeof result.value))throw new PlainUIError('EXPRESSION_TYPE');values.push(encodeURIComponent(String(result.value)));}
  let url:URL;try{url=new URL(values.join(''),base);}catch{throw new PlainUIError('URL_POLICY');}
  if(url.username||url.password||!['http:','https:'].includes(url.protocol))throw new PlainUIError('URL_POLICY');if(options.mode==='request'){url.hash='';if(!options.allowedOrigins.includes(url.origin))throw new PlainUIError('REQUEST_ORIGIN');}else if(options.allowedOrigins.length&&!options.allowedOrigins.includes(url.origin))throw new PlainUIError('REQUEST_ORIGIN');
  if(options.query!==undefined){if(options.mode!=='request')throw new PlainUIError('REQUEST_INVALID');url=applyQuery(url,options.query);}
  return {status:'ready',url};
}
