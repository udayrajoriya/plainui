export interface CapturedNode<Scope=unknown> {readonly node:Node;readonly source:Node;readonly scope:Scope;readonly name:string;readonly order:number}
export interface SlotCapture<Scope=unknown> {readonly nodes:readonly CapturedNode<Scope>[];readonly parked:DocumentFragment}

/** Parks original caller nodes before a host render region is cleared. */
export function captureSlots<Scope>(host:Element,callerScope:Scope,markMove:(node:Node)=>void=()=>{}):SlotCapture<Scope> {const parked=host.ownerDocument.createDocumentFragment(),nodes=[...host.childNodes].map((node,order)=>Object.freeze({node,source:node.cloneNode(true),scope:callerScope,name:node instanceof Element?node.getAttribute('slot')??'':'',order}));for(const item of nodes){markMove(item.node);parked.append(item.node);}return Object.freeze({nodes:Object.freeze(nodes),parked});}
