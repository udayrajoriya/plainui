/** Async identity recomputation drops any result overtaken by a later dependency change. */
export class ResourceDependencies {
  private serial=0;private disposed=false;
  constructor(private readonly evaluate:()=>Promise<string|null>,private readonly accept:(key:string|null)=>void){}
  async changed():Promise<void> {const serial=++this.serial;const key=await this.evaluate();if(!this.disposed&&serial===this.serial)this.accept(key);}
  invalidate():void {this.serial++;}
  dispose():void {this.disposed=true;this.serial++;}
}
