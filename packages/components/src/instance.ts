import {PlainUIError,type JsonValue} from '../../core/src/index.js';
import type {ComponentDefinition} from './definition.js';
import {ComponentRegistry} from './registry.js';
import {compileProps,type PropInput} from './props/compile.js';
import {captureSlots,type CapturedNode} from './slots/capture.js';
import {assignSlots} from './slots/assign.js';
import {projectSlots,type ProjectedSlots} from './slots/project.js';
import {ComponentIdRewriter} from './ids.js';
import {emitComponentEvent} from './events.js';

export interface ComponentInstanceEnvironment<Scope> {readonly root:Element;readonly registry:ComponentRegistry;readonly ids:ComponentIdRewriter;readonly createScope:(definition:ComponentDefinition,inputs:readonly PropInput[],host:Element,callerScope:Scope)=>Scope;readonly connectProps?:(definition:ComponentDefinition,inputs:readonly PropInput[],host:Element,callerScope:Scope,componentScope:Scope)=>void|(()=>void);readonly compile:(node:Node,scope:Scope)=>void|(()=>void);readonly markMove?:(node:Node)=>void;readonly diagnose:(error:unknown)=>void}
export interface ComponentInstance<Scope> {readonly host:Element;readonly scope:Scope;readonly status:'mounted'|'disposed';emit(name:string,detail:JsonValue):boolean;dispose():void}

function candidates<Scope>(host:Element,scope:Scope):CapturedNode<Scope>[] {return [...host.childNodes].map((node,order)=>Object.freeze({node,source:node.cloneNode(true),scope,name:node instanceof Element?node.getAttribute('slot')??'':'',order}));}
function topLevelComponentHosts(parent:ParentNode,registry:ComponentRegistry):Element[] {const result:Element[]=[];const visit=(node:ParentNode):void=>{for(const child of node.children){if(registry.has(child.localName)){result.push(child);continue;}visit(child);}};visit(parent);return result;}

export function mountComponent<Scope>(host:Element,callerScope:Scope,environment:ComponentInstanceEnvironment<Scope>,ancestors:readonly string[]=[]):ComponentInstance<Scope>|null {
  const definition=environment.registry.get(host.localName);if(!definition){environment.diagnose(new PlainUIError('COMPONENT_DEFINITION'));return null;}if(ancestors.length>=128){environment.diagnose(new PlainUIError('COMPONENT_RECURSION'));return null;}
  let inputs:readonly PropInput[],clone:DocumentFragment,scope:Scope;try{inputs=compileProps(host,definition.props);clone=definition.clone();environment.ids.rewrite(clone,definition);assignSlots(clone,candidates(host,callerScope));scope=environment.createScope(definition,inputs,host,callerScope);}catch(error){environment.diagnose(error);return null;}
  const original=[...host.childNodes],releases:(()=>void)[]=[],nested:ComponentInstance<Scope>[]=[];let projection:ProjectedSlots|null=null,disposed=false;
  try {const propRelease=environment.connectProps?.(definition,inputs,host,callerScope,scope);if(propRelease)releases.push(propRelease);const capture=captureSlots(host,callerScope,environment.markMove);projection=projectSlots(assignSlots(clone,capture.nodes),{componentScope:scope,markMove:environment.markMove??(()=>{}),compileProjected:environment.compile,compileFallback:environment.compile});host.append(clone);for(const child of [...host.childNodes]){const release=environment.compile(child,scope);if(release)releases.push(release);}for(const nestedHost of topLevelComponentHosts(host,environment.registry)){const mounted=mountComponent(nestedHost,scope,environment,[...ancestors,definition.name]);if(mounted)nested.push(mounted);}const instance:ComponentInstance<Scope>={host,scope,get status(){return disposed?'disposed':'mounted';},emit:(name,detail)=>{if(disposed)throw new PlainUIError('OWNER_DISPOSED');return emitComponentEvent(host,name,detail);},dispose:()=>{if(disposed)return;disposed=true;for(const item of nested.reverse())item.dispose();for(const release of releases.reverse())release();projection?.dispose();host.replaceChildren();}};return instance;
  } catch(error){for(const item of nested.reverse())item.dispose();for(const release of releases.reverse())release();projection?.dispose();host.replaceChildren(...original);environment.diagnose(error);return null;}
}
