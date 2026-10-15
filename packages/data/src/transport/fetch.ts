import type {JsonValue} from '../../../core/src/index.js';
import {invokeError,invokeSuccess} from '../adapter/invoke.js';
import {normalizeRequestError,type NormalizedRequestError} from '../adapter/error.js';
import type {AdapterContext,RequestAdapter,ResponseMetadata} from '../adapter/registry.js';
import {materializeRequest,type FinalRequestDraft} from '../request/draft.js';
import {decodeHttpErrorBody,decodeJsonSuccess,isHtmlMediaType} from './decode.js';
import {responseMetadata,responseRequestId} from './response-meta.js';

const TIMEOUT_REASON=Symbol('plainui-request-timeout');
function canceled():DOMException {return new DOMException('Operation canceled.','AbortError');}
export interface FetchAttemptOptions {readonly adapter:RequestAdapter;readonly isCurrent:()=>boolean;readonly signalOverride?:AbortSignal;readonly fetchImpl?:typeof fetch;readonly htmlHandler?:(text:string,meta:ResponseMetadata,signal:AbortSignal)=>JsonValue|Promise<JsonValue>;readonly deferErrorHook?:boolean}
export interface FetchAttemptResult {readonly value:JsonValue;readonly metadata:ResponseMetadata}
export class ResponseAttemptFailure extends Error {constructor(readonly error:NormalizedRequestError,readonly body:JsonValue|null,readonly metadata:ResponseMetadata){super('Response attempt failed.');this.name='ResponseAttemptFailure';}}
export class HttpAttemptFailure extends ResponseAttemptFailure {constructor(error:NormalizedRequestError,body:JsonValue|null,metadata:ResponseMetadata){super(error,body,metadata);this.name='HttpAttemptFailure';}}
/** One transport attempt. Retry policy lives outside this function. */
export async function fetchAttempt(draft:FinalRequestDraft,options:FetchAttemptOptions):Promise<FetchAttemptResult> {const detail=materializeRequest(draft),metadata=draft.metadata,signal=options.signalOverride??detail.signal;if(signal.aborted||!options.isCurrent())throw canceled();const controller=new AbortController();let timedOut=false;const abort=()=>controller.abort(signal.reason);signal.addEventListener('abort',abort,{once:true});const timer=setTimeout(()=>{timedOut=true;controller.abort(TIMEOUT_REASON);},metadata.timeoutMs);let response:Response;let text:string;
  try{response=await (options.fetchImpl??fetch)(metadata.url,{method:metadata.method,headers:detail.headers,body:detail.body,credentials:metadata.credentials,redirect:'error',signal:controller.signal});if(signal.aborted||!options.isCurrent())throw canceled();if(response.type==='opaque'||response.type==='opaqueredirect'||response.redirected)throw normalizeRequestError('security',null,{code:'URL_POLICY'});text=await response.text();if(signal.aborted||!options.isCurrent())throw canceled();}
  catch(error){if(signal.aborted||error instanceof DOMException&&error.name==='AbortError'&&!timedOut)throw canceled();if(timedOut||controller.signal.reason===TIMEOUT_REASON)throw normalizeRequestError('timeout');if(error&&typeof error==='object'&&'kind' in error)throw error;throw normalizeRequestError('network');}
  finally{clearTimeout(timer);signal.removeEventListener('abort',abort);}
  const meta=responseMetadata(response),requestId=responseRequestId(response);const context:AdapterContext={signal,timeoutMs:metadata.timeoutMs,isCurrent:options.isCurrent,metadata:{method:metadata.method,url:metadata.url,adapter:metadata.adapter.name,epoch:metadata.epoch,generation:metadata.generation}};
  if(!response.ok){const body=decodeHttpErrorBody(text,response.headers.get('content-type'));const failure=normalizeRequestError('http',response.status,{requestId});if(options.deferErrorHook)throw new HttpAttemptFailure(failure,body,meta);throw await invokeError(options.adapter,failure,body,meta,context);}
  if(metadata.responseMode==='html'){if(!isHtmlMediaType(response.headers.get('content-type'))){const failure=normalizeRequestError('parse',response.status,{code:'RESPONSE_TYPE',requestId});if(options.deferErrorHook)throw new ResponseAttemptFailure(failure,null,meta);throw failure;}if(!options.htmlHandler)throw normalizeRequestError('security',response.status,{code:'MODULE_MISSING',requestId});const handled=await options.htmlHandler(text,meta,signal);if(signal.aborted||!options.isCurrent())throw canceled();return {value:handled,metadata:meta};}
  let body:JsonValue;try{body=decodeJsonSuccess(text,response.status,response.headers.get('content-type'));}catch(error){if(error&&typeof error==='object'&&'kind' in error){if(options.deferErrorHook)throw new ResponseAttemptFailure(error as NormalizedRequestError,null,meta);throw await invokeError(options.adapter,error as NormalizedRequestError,null,meta,context);}throw error;}
  const value=await invokeSuccess(options.adapter,body,meta,context);if(signal.aborted||!options.isCurrent())throw canceled();return {value,metadata:meta};
}
