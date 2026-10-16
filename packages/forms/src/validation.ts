export function validateSubmit(form:HTMLFormElement,submitter:HTMLElement|null):boolean {
  if(form.noValidate||(submitter instanceof HTMLButtonElement||submitter instanceof HTMLInputElement)&&submitter.formNoValidate)return true;
  if(form.checkValidity())return true;
  const first=[...form.elements].find(item=>'willValidate' in item&&(item as HTMLInputElement).willValidate&&!(item as HTMLInputElement).validity.valid) as HTMLElement|undefined;
  if(first){first.focus();if('reportValidity' in first)(first as HTMLInputElement).reportValidity();}else form.reportValidity();
  return false;
}
