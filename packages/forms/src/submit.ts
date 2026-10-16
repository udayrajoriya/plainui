import {PlainUIError,type JsonValue} from '../../core/src/index.js';
type DraftBody={readonly kind:'json';readonly value:unknown}|{readonly kind:'form';readonly value:URLSearchParams}|{readonly kind:'multipart';readonly value:FormData};
import {successfulControls,type ImageCoordinates} from './serialize/successful-controls.js';
import {jsonControls} from './serialize/json.js';
import {urlencodedControls,mergeGetQuery} from './serialize/urlencoded.js';
import {multipartControls} from './serialize/multipart.js';

export interface PreparedForm {readonly url:string;readonly body:DraftBody|undefined;readonly json:JsonValue|null}
export function prepareForm(form:HTMLFormElement,submitter:HTMLElement|null,image:ImageCoordinates,url:string,method:string,encoding:'json'|'form'|'multipart',explicitBody:JsonValue|undefined):PreparedForm {
  if(explicitBody!==undefined){if(method==='GET'||encoding!=='json')throw new PlainUIError('FORM_INVALID');return {url,body:{kind:'json',value:explicitBody},json:explicitBody};}
  const pairs=successfulControls(form,submitter,image);
  if(method==='GET'){if(encoding!=='form')throw new PlainUIError('FORM_INVALID');const query=urlencodedControls(pairs);return {url:mergeGetQuery(new URL(url),query).href,body:undefined,json:null};}
  if(encoding==='json'){const json=jsonControls(pairs);return {url,body:{kind:'json',value:json},json};}
  if(encoding==='form')return {url,body:{kind:'form',value:urlencodedControls(pairs)},json:null};
  return {url,body:{kind:'multipart',value:multipartControls(pairs)},json:null};
}
