import {PlainUIError} from '../../../core/src/index.js';
import type {ModelMount} from '../../../core/src/integration.js';

export function bindCheckbox(mount:ModelMount,element:HTMLInputElement,signal:AbortSignal):()=>void {
  const update=()=>{const value=mount.read();if(typeof value!=='boolean')throw new PlainUIError('FORM_INVALID');element.checked=value;};
  element.addEventListener('change',()=>mount.write(element.checked),{signal});
  update();return update;
}
