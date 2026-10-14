export class IntlCache {
  private entries=new Map<string,Intl.NumberFormat|Intl.DateTimeFormat>();
  getNumber(locale:string,currency?:string):Intl.NumberFormat {
    const key=`number\0${locale}\0${currency??''}`;const hit=this.entries.get(key);if(hit){this.entries.delete(key);this.entries.set(key,hit);return hit as Intl.NumberFormat;}
    const value=new Intl.NumberFormat(locale,currency?{style:'currency',currency}:{});this.entries.set(key,value);this.trim();return value;
  }
  getDate(locale:string,timeZone:string):Intl.DateTimeFormat {
    const key=`date\0${locale}\0${timeZone}`;const hit=this.entries.get(key);if(hit){this.entries.delete(key);this.entries.set(key,hit);return hit as Intl.DateTimeFormat;}
    const value=new Intl.DateTimeFormat(locale,{timeZone,year:'numeric',month:'numeric',day:'numeric'});this.entries.set(key,value);this.trim();return value;
  }
  private trim():void {if(this.entries.size>128)this.entries.delete(this.entries.keys().next().value!);}
  get size():number{return this.entries.size;}
}
