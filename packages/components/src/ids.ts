import type {ComponentDefinition} from './definition.js';

const documentSerials=new WeakMap<Document,{next:number;roots:WeakMap<Element,number>}>();
const rewritten=new WeakSet<DocumentFragment>();

const referenceAttributes=['for','aria-labelledby','aria-describedby','aria-controls'] as const;

function hasDynamicBinding(element:Element,attribute:string):boolean {
  return element.hasAttribute(`ui-bind-${attribute}`)||element.hasAttribute(`data-ui-bind-${attribute}`);
}

function elements(parent:ParentNode):Element[] {
  const found:Element[]=[];
  const visit=(node:ParentNode):void=>{for(const child of node.childNodes){if(!(child instanceof Element))continue;found.push(child);if(child instanceof HTMLTemplateElement)visit(child.content);else visit(child);}};
  visit(parent);
  return found;
}

export interface RewrittenIds {readonly serial:number;readonly prefix:string;readonly ids:ReadonlyMap<string,string>}

/** Allocates collision-free instance IDs for one application root. */
export class ComponentIdRewriter {
  readonly rootSerial:number;
  private nextInstanceSerial=1;
  constructor(private readonly root:Element){const document=root.ownerDocument;let registry=documentSerials.get(document);if(!registry){registry={next:1,roots:new WeakMap()};documentSerials.set(document,registry);}let serial=registry.roots.get(root);if(serial===undefined){serial=registry.next++;registry.roots.set(root,serial);}this.rootSerial=serial;}

  rewrite(fragment:DocumentFragment,definition:Pick<ComponentDefinition,'ids'>):RewrittenIds {
    if(rewritten.has(fragment))return Object.freeze({serial:0,prefix:'',ids:new Map()});
    const nodes=elements(fragment),declared=new Set(definition.ids),dynamic=new Set<string>();
    for(const element of nodes)if(element.id&&hasDynamicBinding(element,'id'))dynamic.add(element.id);
    let serial:number,prefix:string,map:Map<string,string>;
    do {serial=this.nextInstanceSerial++;prefix=`pui-r${this.rootSerial}-c${serial}-`;map=new Map([...declared].filter(id=>!dynamic.has(id)).map(id=>[id,`${prefix}${id}`]));} while([...map.values()].some(id=>this.root.ownerDocument.getElementById(id)!==null));
    for(const element of nodes){const replacement=map.get(element.id);if(replacement)element.id=replacement;for(const attribute of referenceAttributes){if(hasDynamicBinding(element,attribute))continue;const value=element.getAttribute(attribute);if(value===null)continue;const tokens=value.split(/\s+/u).filter(Boolean),updated=tokens.map(token=>map.get(token)??token);element.setAttribute(attribute,updated.join(' '));}}
    rewritten.add(fragment);
    return Object.freeze({serial,prefix,ids:map});
  }
}
