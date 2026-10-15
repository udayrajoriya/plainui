import {PlainUIError} from '../../../core/src/index.js';
import type {ModelMount} from '../../../core/src/integration.js';

export function bindSelect(mount:ModelMount,element:HTMLSelectElement,signal:AbortSignal):{update:()=>void;dispose:()=>void} {
  const update=()=>{const value=mount.read();if(element.multiple){if(!Array.isArray(value)||!value.every(item=>typeof item==='string'))throw new PlainUIError('FORM_INVALID');const chosen=new Set(value);for(const option of element.options)option.selected=chosen.has(option.value);}else{if(typeof value!=='string')throw new PlainUIError('FORM_INVALID');const match=[...element.options].findIndex(option=>option.value===value);element.selectedIndex=match;}};
  element.addEventListener('change',()=>{if(element.multiple)mount.write([...element.selectedOptions].map(option=>option.value));else mount.write(element.selectedIndex<0?'':element.value);},{signal});
  update();const observer=new MutationObserver(()=>{if(mount.owner.active)try{update();}catch(error){mount.diagnose(error);}});
  observer.observe(element,{subtree:true,childList:true,attributes:true,attributeFilter:['value','selected','disabled']});
  return {update,dispose:()=>observer.disconnect()};
}
