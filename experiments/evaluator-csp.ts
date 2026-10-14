import {parseExpression} from '../packages/core/src/expression/parse.js';
import {evaluate} from '../packages/core/src/expression/evaluate.js';
declare global {interface Window {__evalCsp?:{value:unknown;violations:string[]}}}
const violations:string[]=[];
document.addEventListener('securitypolicyviolation',event=>violations.push(event.violatedDirective));
const result=evaluate(parseExpression('len("abc") + 2'),{read:()=>({found:false,value:null})},{locale:'en-US',timeZone:'UTC'});
window.__evalCsp={value:result.ok?result.value:result.code,violations};
