export class FixtureClock {
  private nowMs = 0;
  private nextId = 1;
  private tasks = new Map<number,{due:number;run:()=>void}>();
  get now():number { return this.nowMs; }
  setTimeout(run:()=>void,delay:number):number { const id=this.nextId++; this.tasks.set(id,{due:this.nowMs+Math.max(0,delay),run}); return id; }
  clearTimeout(id:number):void { this.tasks.delete(id); }
  advance(ms:number):void {
    if (!Number.isSafeInteger(ms) || ms<0) throw new Error('Clock advance must be a nonnegative safe integer');
    const target=this.nowMs+ms;
    let iterations=0;
    while (true) {
      const pending=[...this.tasks].filter(([,task])=>task.due<=target).sort((a,b)=>a[1].due-b[1].due || a[0]-b[0])[0];
      if (!pending) break;
      if (++iterations>10000) throw new Error('Fixture clock task limit exceeded');
      this.tasks.delete(pending[0]); this.nowMs=pending[1].due; pending[1].run();
    }
    this.nowMs=target;
  }
  get pending():number { return this.tasks.size; }
  clear():void { this.tasks.clear(); }
}
