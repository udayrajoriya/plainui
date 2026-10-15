import {PlainUIError} from '../../../core/src/index.js';
import type {ControlPair} from './successful-controls.js';

export function urlencodedControls(pairs:readonly ControlPair[]):URLSearchParams {const params=new URLSearchParams();for(const pair of pairs){if(pair.value instanceof File)throw new PlainUIError('FORM_INVALID');params.append(pair.name,pair.value);}return params;}

export function mergeGetQuery(url:URL,params:URLSearchParams):URL {const merged=new URL(url);const keys=new Set(params.keys());for(const key of keys)merged.searchParams.delete(key);for(const [key,value] of params)merged.searchParams.append(key,value);return merged;}
