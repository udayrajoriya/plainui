/** Alternate-envelope adapter for the local Python demonstration backend. */
export const pythonDemoAdapter=Object.freeze({
  version:'1',
  success(body){
    if(!body||typeof body!=='object'||Array.isArray(body)||!Object.hasOwn(body,'payload'))throw new Error('Invalid Python demo envelope');
    return body.payload;
  },
  error(original,body){
    const envelope=body&&typeof body==='object'&&!Array.isArray(body)?body:null;
    const detail=envelope?.error&&typeof envelope.error==='object'&&!Array.isArray(envelope.error)?envelope.error:null;
    if(!detail||typeof detail.type!=='string'||!Array.isArray(detail.violations))return original;
    const fields=Object.create(null);
    for(const item of detail.violations)if(item&&typeof item==='object'&&!Array.isArray(item)&&typeof item.field==='string'&&Array.isArray(item.messages)&&item.messages.every(message=>typeof message==='string'))fields[item.field]=item.messages;
    return {kind:original.kind,status:original.status,code:detail.type,message:typeof detail.detail==='string'?detail.detail:original.message,fields,retryable:original.retryable,requestId:typeof envelope.trace==='string'?envelope.trace:original.requestId};
  },
});
