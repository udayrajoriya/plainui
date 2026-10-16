export interface FieldPresenter {readonly element:Element;readonly name:string}

export function fieldPresenters(form:HTMLFormElement):FieldPresenter[] {
  return [...form.querySelectorAll('[ui-field-error],[data-ui-field-error]')].filter(element=>element.closest('form')===form).map(element=>({element,name:element.getAttribute('ui-field-error')??element.getAttribute('data-ui-field-error')??''}));
}

export function fieldControls(form:HTMLFormElement,name:string):Element[] {return [...form.elements].filter(item=>item instanceof Element&&'name' in item&&(item as HTMLInputElement).name===name) as Element[];}
