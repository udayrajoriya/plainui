import {basicSetup,EditorView} from 'codemirror';
import {EditorState} from '@codemirror/state';

export const PLAINUI_MAJOR=1;

export function editorBehavior(element,options,scope,signal){
  const textarea=element.querySelector('textarea');
  const mount=element.querySelector('[ui-ignore],[data-ui-ignore]');
  if(!(textarea instanceof HTMLTextAreaElement)||!(mount instanceof HTMLElement))throw new Error('editor behavior requires a fallback textarea and ui-ignore mount');
  const path=typeof options.documentPath==='string'?options.documentPath:'document';
  const initial=scope.get(path),text=typeof initial==='string'?initial:textarea.value;
  if(initial!==text)scope.set(path,text);
  const listener=EditorView.updateListener.of(update=>{if(!update.docChanged||signal.aborted)return;const next=update.state.doc.toString();if(scope.get(path)!==next)scope.set(path,next);textarea.value=next;});
  const view=new EditorView({state:EditorState.create({doc:text,extensions:[basicSetup,listener]}),parent:mount});
  const synchronize=()=>{if(signal.aborted)return;const next=scope.get(path);if(typeof next!=='string')return;const current=view.state.doc.toString();if(next!==current)view.dispatch({changes:{from:0,to:current.length,insert:next}});};
  element.addEventListener('plainui:editor-set',synchronize);
  return()=>{element.removeEventListener('plainui:editor-set',synchronize);view.destroy();};
}

export function registerEditorExample(app){app.registerBehavior('editor',editorBehavior);return app;}
