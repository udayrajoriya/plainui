import type {ComponentRoot} from '../../core/src/integration.js';
import {ComponentRegistry} from '../../components/src/registry.js';
import {discoverInline} from '../../components/src/discover.js';
import {ComponentImportGraph} from '../../components/src/imports/graph.js';

export function createComponentRoot(root:Element,diagnose:(error:unknown)=>void):ComponentRoot {const registry=new ComponentRegistry(diagnose);let graph:ComponentImportGraph|null=null;return {discover:()=>discoverInline(root,registry),loadImports:async(urls,timeoutMs,signal)=>{graph=new ComponentImportGraph(root.ownerDocument,registry,timeoutMs,signal,diagnose);await graph.load(urls);},freeze:()=>registry.freeze(),definition:name=>registry.get(name),dispose:()=>{graph?.dispose();registry.dispose();}};}
