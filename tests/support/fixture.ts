export type BuildMode = 'classic' | 'esm';
export type FixtureStep =
  | { op:'mount'; selector:string }
  | { op:'awaitReady'; timeoutMs:number }
  | { op:'set'; path:string; value:unknown }
  | { op:'dispatch'; selector:string; event:string }
  | { op:'input'; selector:string; value:string }
  | { op:'resolve'|'reject'; barrier:string; status?:number; headers?:Record<string,string>; body?:string }
  | { op:'advanceClock'; ms:number }
  | { op:'flush'; timeoutMs:number }
  | { op:'navigate'; path:string }
  | { op:'unmount' }
  | { op:'inspect'; predicate:{path:string;equals:unknown}; timeoutMs:number };
export interface ConformanceFixture {
  id:string;
  rfc:string[];
  html:string;
  config?:unknown;
  modules?:Array<'router'|'fragments'|'ui'>;
  registrations?:Record<string,unknown>;
  storageSeed?:Record<string,string>;
  httpScript?:Array<{method?:string;path:string;barrier?:string;status?:number;headers?:Record<string,string>;body?:string;redirect?:string;close?:boolean}>;
  steps:FixtureStep[];
  expected?:{dom?:Record<string,string|null>;state?:Record<string,unknown>;events?:string[];diagnostics?:string[];requestCount?:number;modules?:string[]};
  teardown?:{owners?:number;timers?:number;listeners?:number;subscribers?:number};
  browsers?:Array<'chromium'|'firefox'|'webkit'>;
}
export type FixtureOutcome = {dom:Record<string,string|null>;state:Record<string,unknown>;events:string[];diagnostics:string[];requestCount:number;modules:string[];counts:{owners:number;timers:number;listeners:number;subscribers:number}};
