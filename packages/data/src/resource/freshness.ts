export interface FreshnessConsumer {readonly active:()=>boolean;readonly deadline:()=>number|null;readonly expire:()=>void}
/** One root timer tracks the nearest positive TTL boundary among live records. */
export class FreshnessScheduler {
  private readonly consumers=new Set<FreshnessConsumer>();private timer:ReturnType<typeof setTimeout>|null=null;
  constructor(private readonly now:()=>number=Date.now){}
  add(consumer:FreshnessConsumer):()=>void {this.consumers.add(consumer);this.reschedule();return()=>{this.consumers.delete(consumer);this.reschedule();};}
  reschedule():void {if(this.timer!==null){clearTimeout(this.timer);this.timer=null;}let earliest=Infinity;const now=this.now();for(const consumer of this.consumers){if(!consumer.active())continue;const deadline=consumer.deadline();if(deadline!==null&&Number.isFinite(deadline)){if(deadline<=now){consumer.expire();continue;}earliest=Math.min(earliest,deadline);}}if(earliest<Infinity)this.timer=setTimeout(()=>{this.timer=null;this.reschedule();},Math.max(0,earliest-now));}
  dispose():void {if(this.timer!==null)clearTimeout(this.timer);this.timer=null;this.consumers.clear();}
  get timerCount():number {return this.timer===null?0:1;}
}
