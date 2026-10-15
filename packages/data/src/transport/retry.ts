import {PlainUIError} from '../../../core/src/index.js';
import {invokeError} from '../adapter/invoke.js';
import type {NormalizedRequestError} from '../adapter/error.js';
import type {AdapterContext} from '../adapter/registry.js';
import {materializeRequest,type FinalRequestDraft} from '../request/draft.js';
import {fetchAttempt,HttpAttemptFailure,ResponseAttemptFailure,type FetchAttemptOptions,type FetchAttemptResult} from './fetch.js';

function canceled():DOMException {return new DOMException('Operation canceled.','AbortError');}
function isFailure(input:unknown):input is NormalizedRequestError {return Boolean(input&&typeof input==='object'&&'kind' in input&&'status' in input);}
function shouldRetry(error:unknown):boolean {if(error instanceof HttpAttemptFailure)return [502,503,504].includes(error.error.status??0);return isFailure(error)&&(error.kind==='network'||error.kind==='timeout');}
function backoff(milliseconds:number,signal:AbortSignal):Promise<void> {return new Promise<void>((resolve,reject)=>{if(signal.aborted){reject(canceled());return;}let done=false;const finish=(error?:DOMException)=>{if(done)return;done=true;clearTimeout(timer);signal.removeEventListener('abort',abort);if(error)reject(error);else resolve();};const abort=()=>finish(canceled());const timer=setTimeout(()=>finish(),milliseconds);signal.addEventListener('abort',abort,{once:true});});}
/** Runs 1 + retry GET attempts; mutations always run once. */
export async function requestWithRetry(draft:FinalRequestDraft,options:FetchAttemptOptions):Promise<FetchAttemptResult> {const metadata=draft.metadata,signal=options.signalOverride??materializeRequest(draft).signal;if(!Number.isSafeInteger(metadata.retry)||metadata.retry<0||metadata.retry>3||metadata.method!=='GET'&&metadata.retry!==0)throw new PlainUIError('REQUEST_INVALID');const context:AdapterContext={signal,timeoutMs:metadata.timeoutMs,isCurrent:options.isCurrent,metadata:{method:metadata.method,url:metadata.url,adapter:metadata.adapter.name,epoch:metadata.epoch,generation:metadata.generation}};
  for(let attempt=0;attempt<=metadata.retry;attempt++){if(signal.aborted||!options.isCurrent())throw canceled();try{return await fetchAttempt(draft,{...options,deferErrorHook:true});}catch(error){if(signal.aborted||!options.isCurrent()||error instanceof DOMException&&error.name==='AbortError')throw canceled();if(attempt<metadata.retry&&metadata.method==='GET'&&shouldRetry(error)){await backoff(500*2**attempt,signal);if(signal.aborted||!options.isCurrent())throw canceled();continue;}
      if(error instanceof ResponseAttemptFailure)throw await invokeError(options.adapter,error.error,error.body,error.metadata,context);
      if(isFailure(error)&&error.kind!=='adapter')throw await invokeError(options.adapter,error,null,null,context);
      throw error;
    }}
  throw new PlainUIError('REQUEST_INVALID');
}
