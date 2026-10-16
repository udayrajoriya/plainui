import Chart from 'chart.js/auto';

export const PLAINUI_MAJOR=1;

export function chartBehavior(element,options,scope,signal){
  const canvas=element.querySelector('[ui-ignore] canvas,[data-ui-ignore] canvas');
  if(!(canvas instanceof HTMLCanvasElement))throw new Error('chart behavior requires a canvas inside ui-ignore');
  const path=typeof options.dataPath==='string'?options.dataPath:'chartData';
  const read=()=>{const value=scope.get(path);return value&&typeof value==='object'&&!Array.isArray(value)?value:{labels:[],datasets:[]};};
  const chart=new Chart(canvas,{type:typeof options.type==='string'?options.type:'bar',data:read(),options:{animation:false,responsive:false}});
  const update=()=>scope.afterFlush(()=>{if(signal.aborted)return;const next=read();chart.data={labels:Array.isArray(next.labels)?[...next.labels]:[],datasets:Array.isArray(next.datasets)?next.datasets.map(item=>({...item})):[]};chart.update('none');});
  element.addEventListener('plainui:chart-update',update);
  const cancel=scope.afterFlush(()=>{if(!signal.aborted)chart.update('none');});
  return()=>{cancel();element.removeEventListener('plainui:chart-update',update);chart.destroy();};
}

export function registerChartExample(app){
  app.registerBehavior('chart',chartBehavior);
  app.registerCommand('renderChart',context=>context.scope.afterFlush(()=>{const chart=context.scope.refs.get('salesChart');chart?.dispatchEvent(new CustomEvent('plainui:chart-update'));}));
  return app;
}
