import { DIAGNOSTICS, type DiagnosticCode } from '../../../schema/src/diagnostics.js';
import { safeDirective, safeSpan, safeUrlLocation, type SafeSpan } from './redact.js';
export type Diagnostic={readonly code:DiagnosticCode;readonly severity:'error'|'warning';readonly message:string;readonly rootId:string;readonly ownerId?:number;readonly directive?:string;readonly location?:string;readonly span?:SafeSpan;readonly correlationId?:string};
export type DiagnosticListener=(diagnostic:Diagnostic)=>void;
export class DiagnosticBus {
  private listeners=new Set<DiagnosticListener>();
  constructor(private readonly rootId:string,private readonly debug:boolean) {}
  subscribe(listener:DiagnosticListener):()=>void { this.listeners.add(listener);let active=true;return()=>{if(active){active=false;this.listeners.delete(listener);}}; }
  emit(code:DiagnosticCode,context:{ownerId?:number;directive?:string;location?:string;span?:SafeSpan;correlationId?:string}={}):Diagnostic {
    const [severity,message]=DIAGNOSTICS[code];
    const directive=safeDirective(context.directive);
    const span=this.debug?safeSpan(context.span):undefined;
    const diagnostic:Diagnostic=Object.freeze({code,severity,message,rootId:this.rootId,...(context.ownerId===undefined?{}:{ownerId:context.ownerId}),...(directive?{directive}:{}),...(context.location?{location:context.location.includes('://')?safeUrlLocation(context.location):context.location.split(/[?#]/,1)[0]}:{}),...(span?{span}:{}),...(context.correlationId&&/^[A-Za-z0-9_-]{1,64}$/.test(context.correlationId)?{correlationId:context.correlationId}:{})});
    for(const listener of [...this.listeners])try{listener(diagnostic);}catch{/* Logging must never interrupt compilation or disposal. */}
    return diagnostic;
  }
  clear():void { this.listeners.clear(); }
}
