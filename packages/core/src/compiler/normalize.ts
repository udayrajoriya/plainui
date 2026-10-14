import {canonicalDirective,resolveDirective,type Directive} from '../../../schema/src/directives.js';
export interface NormalizedDirective {readonly name:string;readonly sourceName:string;readonly value:string;readonly directive:Directive;readonly element:Element}
export interface NormalizeIssue {readonly code:'UNKNOWN_DIRECTIVE'|'DIRECTIVE_CONFLICT';readonly name:string;readonly element:Element}
export function normalizeElement(element:Element):{directives:NormalizedDirective[];issues:NormalizeIssue[]} {
  const directives:NormalizedDirective[]=[];const issues:NormalizeIssue[]=[];const seen=new Set<string>();
  for(const attribute of element.attributes){if(!attribute.name.startsWith('ui-')&&!attribute.name.startsWith('data-ui-'))continue;const name=canonicalDirective(attribute.name);const directive=resolveDirective(attribute.name);
    if(!directive){issues.push({code:'UNKNOWN_DIRECTIVE',name:attribute.name,element});continue;}
    if(seen.has(name)){issues.push({code:'DIRECTIVE_CONFLICT',name,element});continue;}
    seen.add(name);directives.push({name,sourceName:attribute.name,value:attribute.value,directive,element});
  }
  return {directives,issues};
}
