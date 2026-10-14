import { createServer, type IncomingMessage, type Server, type ServerResponse } from 'node:http';
import { readFile } from 'node:fs/promises';
import { resolve, sep } from 'node:path';
import type { AddressInfo } from 'node:net';
import type { ConformanceFixture } from './fixture.js';

type Script = NonNullable<ConformanceFixture['httpScript']>[number];
type Pending = {response:ServerResponse;script:Script};
export class FixtureServer {
  private servers:Server[]=[];
  private pending=new Map<string,Pending[]>();
  private script:Script[]=[];
  readonly requests:Array<{origin:number;method:string;path:string}>=[];
  origins:string[]=[];
  private async handle(origin:number,request:IncomingMessage,response:ServerResponse):Promise<void> {
    const path=new URL(request.url??'/',`http://${request.headers.host}`).pathname;
    if (path==='/' || path==='/index.html') { response.writeHead(200,{'content-type':'text/html'}); response.end('<!doctype html><meta charset="utf-8"><title>PlainUI fixture</title><main id="fixture"></main>'); return; }
    if (path==='/favicon.ico') { response.writeHead(204); response.end(); return; }
    if (path.startsWith('/dist/')) {
      try { const file=resolve('dist',path.slice(6)); if (!file.startsWith(resolve('dist')+sep)) throw new Error('Asset path escape'); const body=await readFile(file); response.writeHead(200,{'content-type':path.endsWith('.mjs')||path.endsWith('.js')?'text/javascript':'text/css'}); response.end(body); }
      catch { response.writeHead(404); response.end(); }
      return;
    }
    this.requests.push({origin,method:request.method??'GET',path});
    const index=this.script.findIndex(item => item.path===path && (item.method??'GET')===(request.method??'GET'));
    if (index<0) { response.writeHead(599); response.end('Unexpected fixture request'); return; }
    const [script]=this.script.splice(index,1);
    if (!script) return;
    if (script.barrier) { const list=this.pending.get(script.barrier)??[]; list.push({response,script}); this.pending.set(script.barrier,list); return; }
    this.respond(response,script);
  }
  private respond(response:ServerResponse,script:Script):void {
    if (script.close) { response.destroy(); return; }
    if (script.redirect) { response.writeHead(script.status??302,{location:script.redirect,...script.headers}); response.end(); return; }
    response.writeHead(script.status??200,script.headers??{'content-type':'application/json'}); response.end(script.body??'null');
  }
  async start():Promise<void> {
    for (let i=0;i<2;i++) {
      const server=createServer((req,res)=>{ void this.handle(i,req,res).catch(()=>{res.writeHead(500);res.end();}); });
      await new Promise<void>(resolve=>server.listen(0,'127.0.0.1',resolve));
      this.servers.push(server); this.origins.push(`http://127.0.0.1:${(server.address() as AddressInfo).port}`);
    }
  }
  reset(script:Script[]=[]):void { this.script=[...script]; this.requests.length=0; for (const list of this.pending.values()) for (const item of list) item.response.destroy(); this.pending.clear(); }
  release(barrier:string,override:Partial<Script>={}):void {
    const list=this.pending.get(barrier);
    if (!list?.length) throw new Error(`Unknown response barrier: ${barrier}`);
    this.pending.delete(barrier);
    for (const item of list) this.respond(item.response,{...item.script,...override});
  }
  get pendingBarriers():number { return [...this.pending.values()].reduce((count,list)=>count+list.length,0); }
  get unsentExpected():number { return this.script.length; }
  async close():Promise<void> { for (const list of this.pending.values()) for (const item of list) item.response.destroy(); this.pending.clear(); await Promise.all(this.servers.map(server=>new Promise<void>(resolve=>server.close(()=>resolve())))); this.servers=[]; this.origins=[]; }
}
