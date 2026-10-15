import {PlainUIError,type JsonValue} from '../../../core/src/index.js';
import type {ControlPair} from './successful-controls.js';

export function jsonControls(pairs:readonly ControlPair[]):JsonValue {
  const result:Record<string,JsonValue>={};
  for(const pair of pairs){if(pair.value instanceof File)throw new PlainUIError('FORM_INVALID');let value:JsonValue=pair.value;
    if(pair.control instanceof HTMLInputElement&&['number','range'].includes(pair.control.type)){if(pair.value==='')value=null;else {const numeric=pair.control.valueAsNumber;if(!Number.isFinite(numeric))throw new PlainUIError('FORM_INVALID');value=numeric;}}
    if(Object.hasOwn(result,pair.name)){const previous=result[pair.name]!;result[pair.name]=Array.isArray(previous)?[...previous,value]:[previous,value];}else result[pair.name]=value;
  }
  return result;
}
