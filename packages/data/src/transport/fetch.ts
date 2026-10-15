import type {JsonValue} from '../../../core/src/index.js';
import {invokeError,invokeSuccess} from '../adapter/invoke.js';
import {normalizeRequestError} from '../adapter/error.js';
import type {AdapterContext,RequestAdapter,ResponseMetadata} from '../adapter/registry.js';
import {materializeRequest,type FinalRequestDraft} from '../request/draft.js';
import {decodeHttpErrorBody,decodeJsonSuccess,isHtmlMediaType} from './decode.js';
import {responseMetadata,responseRequestId} from './response-meta.js';

const TIMEOUT_REASON=Symbol('plainui-request-timeout');
function canceled():DOMException {return new DOMException('Operation canceled.','AbortError');}
export interface FetchAttemptOptions {readonly adapter:RequestAdapter;readonly isCurrent:()=>boolean;readonly fetchImpl?:typeof fetch;readonly htmlHandler?:(text:string,meta:ResponseMetadata,signal:AbortSignal)=>JsonValue|Promise<JsonValue>}
export interface FetchAttemptResult {readonly value:JsonValue;readonly metadata:ResponseMetadata}
/** One transport attempt. Retry policy lives outside this function. */
export async function fetchAttempt(draft:FinalRequestDraft,options:FetchAttemptOptions):Promise<FetchAttemptResult> {const detail=materializeRequest(draft),metadata=draft.metadata;if(detail.signal.aborted||!options.isCurrent())throw canceled();const controller=new AbortController();let timedOut=false;const abort=()=>controller.abort(detail.signal.reason);detail.signal.addEventListener('abort',abort,{once:true});const timer=setTimeout(()=>{timedOut=true;controller.abort(TIMEOUT_REASON);},metadata.timeoutMs);let response:Response;let text:string;
  try{response=await (options.fetchImpl??fetch)(metadata.url,{method:metadata.method,headers:detail.headers,body:detail.body,credentials:metadata.credentials,redirect:'error',signal:controller.signal});if(detail.signal.aborted||!options.isCurrent())throw canceled();if(response.type==='opaque'||response.type==='opaqueredirect'||response.redirected)throw normalizeRequestError('security',null,{code:'URL_POLICY'});text=await response.text();if(detail.signal.aborted||!options.isCurrent())throw canceled();}
  catch(error){if(detail.signal.aborted||error instanceof DOMException&&error.name==='AbortError'&&!timedOut)throw canceled();if(timedOut||controller.signal.reason===TIMEOUT_REASON)throw normalizeRequestError('timeout');if(error&&typeof error==='object'&&'kind' in error)throw error;throw normalizeRequestError('network');}
  finally{clearTimeout(timer);detail.signal.removeEventListener('abort',abort);}
  const meta=responseMetadata(response),requestId=responseRequestId(response);const context:AdapterContext={signal:detail.signal,timeoutMs:metadata.timeoutMs,isCurrent:options.isCurrent,metadata:{method:metadata.method,url:metadata.url,adapter:metadata.adapter.name,epoch:metadata.epoch,generation:metadata.generation}};
  if(!response.ok){const body=decodeHttpErrorBody(text,response.headers.get('content-type'));const failure=normalizeRequestError('http',response.status,{requestId});throw await invokeError(options.adapter,failure,body,meta,context);}
  if(metadata.responseMode==='html'){if(!isHtmlMediaType(response.headers.get('content-type')))throw normalizeRequestError('parse',response.status,{code:'RESPONSE_TYPE',requestId});if(!options.htmlHandler)throw normalizeRequestError('security',response.status,{code:'MODULE_MISSING',requestId});const handled=await options.htmlHandler(text,meta,detail.signal);if(detail.signal.aborted||!options.isCurrent())throw canceled();return {value:handled,metadata:meta};}
  let body:JsonValue;try{body=decodeJsonSuccess(text,response.status,response.headers.get('content-type'));}catch(error){if(error&&typeof error==='object'&&'kind' in error)throw await invokeError(options.adapter,error as ReturnType<typeof normalizeRequestError>,null,meta,context);throw error;}
  const value=await invokeSuccess(options.adapter,body,meta,context);if(detail.signal.aborted||!options.isCurrent())throw canceled();return {value,metadata:meta};
}
