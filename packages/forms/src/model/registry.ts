import type {ModelMount} from '../../../core/src/integration.js';

const formModels=new WeakMap<HTMLFormElement,Set<ModelMount>>();

export function registerFormModel(mount:ModelMount):()=>void {
  const element=mount.element;
  const form=element instanceof HTMLInputElement||element instanceof HTMLTextAreaElement||element instanceof HTMLSelectElement?element.form:null;
  if(!form)return ()=>{};
  let models=formModels.get(form);if(!models){models=new Set();formModels.set(form,models);}
  models.add(mount);
  return ()=>{models!.delete(mount);if(models!.size===0)formModels.delete(form);};
}

export function getFormModels(form:HTMLFormElement):readonly ModelMount[] {return [...(formModels.get(form)??[])];}
