import {PlainUIError} from '../../../core/src/index.js';
import type {ModelMount} from '../../../core/src/integration.js';

interface Member {element:HTMLInputElement;path:string;update:()=>void}
const groups=new WeakMap<Document,Set<Member>>();
export function bindRadio(mount:ModelMount,element:HTMLInputElement,signal:AbortSignal):{update:()=>void;dispose:()=>void} {
  const document=element.ownerDocument;let members=groups.get(document);if(!members){members=new Set();groups.set(document,members);}
  const owner=element.form;const name=element.name;
  if(name&&[...members].some(item=>item.element.form===owner&&item.element.name===name&&item.path!==mount.path))throw new PlainUIError('FORM_INVALID');
  const update=()=>{const value=mount.read();if(typeof value!=='string')throw new PlainUIError('FORM_INVALID');element.checked=value===element.value;};
  update();const member={element,path:mount.path,update};members.add(member);
  element.addEventListener('change',()=>{if(element.checked)mount.write(element.value);},{signal});
  return {update,dispose:()=>{members!.delete(member);if(members!.size===0)groups.delete(document);}};
}
