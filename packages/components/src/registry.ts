import {PlainUIError} from '../../core/src/index.js';
import {compileDefinition,type ComponentDefinition} from './definition.js';

export class ComponentRegistry {
  private readonly definitions=new Map<string,ComponentDefinition>();
  private readonly invalid=new Set<string>();
  private frozen=false;
  constructor(private readonly diagnose:(error:unknown)=>void){}
  register(template:HTMLTemplateElement):void {if(this.frozen)throw new PlainUIError('REGISTRY_INVALID');const name=template.getAttribute('ui-component')??template.getAttribute('data-ui-component')??'';try{if(this.definitions.has(name)||this.invalid.has(name)){this.definitions.delete(name);this.invalid.add(name);throw new PlainUIError('COMPONENT_DEFINITION');}const definition=compileDefinition(template);this.definitions.set(definition.name,definition);}catch(error){if(name)this.invalid.add(name);this.diagnose(error);}}
  get(name:string):ComponentDefinition|undefined {return this.invalid.has(name)?undefined:this.definitions.get(name);}
  has(name:string):boolean {return this.get(name)!==undefined;}
  freeze():void {this.frozen=true;}
  dispose():void {this.definitions.clear();this.invalid.clear();this.frozen=true;}
  names():readonly string[] {return [...this.definitions.keys()].filter(name=>!this.invalid.has(name));}
}
