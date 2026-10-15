import {PlainUIError} from '../../../core/src/index.js';

export interface ControlPair {readonly name:string;readonly value:string|File;readonly control:Element;readonly selectedFile:boolean}
export interface ImageCoordinates {readonly x:number;readonly y:number}

/** FormData(form, submitter) is probed because older browsers omit the submitter overload. */
export function supportsSubmitterFormData(form:HTMLFormElement,submitter:HTMLElement):boolean {
  if(!(submitter instanceof HTMLButtonElement||submitter instanceof HTMLInputElement)||submitter.form!==form)return false;
  try {const probe=form.ownerDocument.createElement('form'),button=form.ownerDocument.createElement('button');button.type='submit';button.name='plainui-probe';button.value='yes';probe.append(button);return new FormData(probe,button).get('plainui-probe')==='yes';}catch{return false;}
}

function eligible(element:Element):element is HTMLInputElement|HTMLSelectElement|HTMLTextAreaElement|HTMLButtonElement {
  return element instanceof HTMLInputElement||element instanceof HTMLSelectElement||element instanceof HTMLTextAreaElement||element instanceof HTMLButtonElement;
}

export function successfulControls(form:HTMLFormElement,submitter:HTMLElement|null=null,image:ImageCoordinates={x:0,y:0}):ControlPair[] {
  if(submitter&&(!(submitter instanceof HTMLInputElement||submitter instanceof HTMLButtonElement)||submitter.form!==form))throw new PlainUIError('FORM_INVALID');
  const controls=[...form.ownerDocument.querySelectorAll('input,select,textarea,button')].filter(element=>eligible(element)&&element.form===form) as (HTMLInputElement|HTMLSelectElement|HTMLTextAreaElement|HTMLButtonElement)[];
  const pairs:ControlPair[]=[];
  const add=(name:string,value:string|File,control:Element,selectedFile=false)=>pairs.push({name,value,control,selectedFile});
  for(const control of controls){if((!control.name&&!(control instanceof HTMLInputElement&&control.type==='image'&&control===submitter))||control.matches(':disabled'))continue;
    if(control instanceof HTMLButtonElement){if(control!==submitter||control.type!=='submit')continue;add(control.name,control.value,control);continue;}
    if(control instanceof HTMLInputElement){const type=control.type;
      if(type==='reset'||type==='button')continue;
      if(type==='submit'){if(control===submitter)add(control.name,control.value,control);continue;}
      if(type==='image'){if(control===submitter){const x=Math.max(0,Math.floor(image.x)),y=Math.max(0,Math.floor(image.y));add(control.name?`${control.name}.x`:'x',String(x),control);add(control.name?`${control.name}.y`:'y',String(y),control);}continue;}
      if((type==='checkbox'||type==='radio')&&!control.checked)continue;
      if(type==='file'){if(control.files?.length){for(const file of control.files)add(control.name,file,control,true);}else add(control.name,new File([''],'',{type:'application/octet-stream'}),control,false);continue;}
      add(control.name,control.value,control);continue;
    }
    if(control instanceof HTMLSelectElement){for(const option of control.selectedOptions)if(!option.disabled&&!option.closest('optgroup[disabled]'))add(control.name,option.value,control);continue;}
    add(control.name,control.value,control);
  }
  return pairs;
}
