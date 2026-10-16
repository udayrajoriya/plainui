import {parseDeveloperImport,PlainUIError} from '../../../core/src/index.js';

export interface ParsedImport {readonly definitions:readonly HTMLTemplateElement[];readonly imports:readonly string[]}
export function parseImport(markup:string,document:Document):ParsedImport {let fragment:DocumentFragment;try{fragment=parseDeveloperImport(markup,document);}catch{throw new PlainUIError('COMPONENT_IMPORT');}const definitions:HTMLTemplateElement[]=[],imports:string[]=[];
  const inspect=(parent:ParentNode)=>{for(const node of parent.childNodes){if(!(node instanceof Element))continue;if(['script','style'].includes(node.localName))throw new PlainUIError('COMPONENT_IMPORT');if(node instanceof HTMLTemplateElement)inspect(node.content);else inspect(node);}};
  for(const node of fragment.childNodes){if(!(node instanceof HTMLTemplateElement))throw new PlainUIError('COMPONENT_IMPORT');inspect(node.content);const source=node.getAttribute('ui-import')??node.getAttribute('data-ui-import');if(source!==null){if(node.content.childNodes.length||node.hasAttribute('ui-component')||node.hasAttribute('data-ui-component'))throw new PlainUIError('COMPONENT_IMPORT');imports.push(source);}else if(node.hasAttribute('ui-component')||node.hasAttribute('data-ui-component'))definitions.push(node);else throw new PlainUIError('COMPONENT_IMPORT');}
  return {definitions,imports};
}
