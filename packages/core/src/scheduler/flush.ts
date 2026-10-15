import {PlainUIError} from '../diagnostics/codes.js';
import {emptyQueues,hasJobs,PHASES,type Job,type Phase,type Queues} from './queues.js';

export class Scheduler {
  private queues:Queues=emptyQueues();private next:Queues=emptyQueues();private scheduled=false;private flushing=false;private disposed=false;
  constructor(private readonly onError:(error:unknown)=>void){}
  enqueue(phase:Phase,job:Job):void {if(this.disposed||job.owner&&!job.owner.active)return;(this.flushing?this.next:this.queues)[phase].add(job);this.schedule();}
  private schedule():void {if(this.scheduled||this.flushing||this.disposed)return;this.scheduled=true;queueMicrotask(()=>this.flush());}
  private flush():void {
    if(this.disposed)return;this.scheduled=false;this.flushing=true;let pass=0;
    try {while(hasJobs(this.queues)||hasJobs(this.next)){
      if(!hasJobs(this.queues)){this.queues=this.next;this.next=emptyQueues();}
      if(++pass>100){this.onError(new PlainUIError('UPDATE_LOOP'));this.queues=emptyQueues();this.next=emptyQueues();break;}
      for(const phase of PHASES){const jobs=[...this.queues[phase]];this.queues[phase].clear();for(const job of jobs){if(this.disposed)return;if(job.owner&&!job.owner.active)continue;try{job.run();}catch(error){this.onError(error);}}}
      this.queues=this.next;this.next=emptyQueues();
    }}finally{this.flushing=false;if(!this.disposed&&hasJobs(this.queues))this.schedule();}
  }
  afterFlush(owner:{readonly active:boolean},callback:()=>void):()=>void {let active=true;const job:Job={owner,run:()=>{if(active){active=false;callback();}}};this.enqueue('afterFlush',job);return ()=>{active=false;this.queues.afterFlush.delete(job);this.next.afterFlush.delete(job);};}
  dispose():void {this.disposed=true;this.queues=emptyQueues();this.next=emptyQueues();}
  get pendingCount():number {return Object.values(this.queues).reduce((count,queue)=>count+queue.size,0)+Object.values(this.next).reduce((count,queue)=>count+queue.size,0);}
}
