import {parse,type DefaultTreeAdapterMap} from 'parse5';

type P5Node=DefaultTreeAdapterMap['node'];
type P5Element=DefaultTreeAdapterMap['element'];
type SourceLocation={startLine:number;startCol:number;startOffset:number;endLine:number;endCol:number;endOffset:number;attrs?:Record<string,SourceLocation>};
export interface HtmlAttribute {readonly name:string;readonly value:string;readonly line:number;readonly column:number}
export interface HtmlNode {readonly tagName:string;readonly attributes:ReadonlyMap<string,string>;readonly attributeList:readonly HtmlAttribute[];readonly line:number;readonly column:number;readonly parent:HtmlNode|null;readonly children:readonly HtmlNode[]}
export interface HtmlDocument {readonly file:string;readonly source:string;readonly roots:readonly HtmlNode[];readonly nodes:readonly HtmlNode[]}

function element(node:P5Node):node is P5Element{return 'tagName' in node&&typeof node.tagName==='string';}
export function parseHtml(file:string,source:string):HtmlDocument {
  const document=parse(source,{sourceCodeLocationInfo:true}),nodes:HtmlNode[]=[];
  const visit=(input:P5Node,parent:HtmlNode|null):HtmlNode|null=>{if(!element(input))return null;const location=input.sourceCodeLocation as SourceLocation|null,attributes=new Map(input.attrs.map(item=>[item.name,item.value]));let current:HtmlNode;
    const children:HtmlNode[]=[];current={tagName:input.tagName,attributes,attributeList:input.attrs.map(item=>{const at=location?.attrs?.[item.name];return {name:item.name,value:item.value,line:at?.startLine??location?.startLine??1,column:at?.startCol??location?.startCol??1};}),line:location?.startLine??1,column:location?.startCol??1,parent,children};nodes.push(current);
    const descendants=input.tagName==='template'&&'content' in input?(input.content as DefaultTreeAdapterMap['documentFragment']).childNodes:input.childNodes;for(const child of descendants){const converted=visit(child,current);if(converted)children.push(converted);}return current;};
  const roots:HtmlNode[]=[];const walk=(input:P5Node):void=>{const converted=visit(input,null);if(converted)roots.push(converted);else if('childNodes' in input)for(const child of input.childNodes)walk(child);};walk(document);return {file,source,roots,nodes};
}

export function directiveAttributes(node:HtmlNode):Map<string,string>{return new Map(node.attributeList.filter(item=>item.name.startsWith('ui-')||item.name.startsWith('data-ui-')).map(item=>[item.name,item.value]));}
export function attributeLocation(node:HtmlNode,name:string):{line:number;column:number}{const attribute=node.attributeList.find(item=>item.name===name||item.name===`data-${name}`);return attribute?{line:attribute.line,column:attribute.column}:{line:node.line,column:node.column};}
