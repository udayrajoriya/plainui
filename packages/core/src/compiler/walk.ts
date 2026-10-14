import type {DirectiveIssue} from '../../../schema/src/directives.js';
import {normalizeElement} from './normalize.js';
import {validateElement} from './validate.js';
import {createPlan,type BindingPlan} from './plan.js';
export interface CompileResult {readonly plans:BindingPlan[];readonly issues:Array<DirectiveIssue&{element:Element}>;readonly fatal:boolean}
export function compileTree(root:Element):CompileResult {
  const plans:BindingPlan[]=[];const issues:Array<DirectiveIssue&{element:Element}>=[];
  const visit=(element:Element):void=>{const normalized=normalizeElement(element);issues.push(...normalized.issues);issues.push(...validateElement(element,normalized.directives).map(issue=>({...issue,element})));
    if(!issues.some(issue=>issue.element===element))plans.push(createPlan(element,normalized.directives));
    const names=new Set(normalized.directives.map(item=>item.name));if(names.has('ui-ignore')||names.has('ui-component')||names.has('ui-import')||names.has('ui-route'))return;
    const children=element instanceof HTMLTemplateElement?element.content.children:element.children;for(const child of children)visit(child);
  };visit(root);return {plans,issues,fatal:issues.some(issue=>issue.element===root&&['ui-app','ui-config'].includes(issue.name))};
}
