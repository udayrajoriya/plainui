// Plain JavaScript: register extensions before mounting the root.
import {PlainUI} from '../packages/runtime/src/esm.js';

const app=PlainUI.create();
app.registerCommand('increment',({scope})=>scope.set('count',scope.get('count')+1));
app.onDiagnostic(diagnostic=>console.warn(diagnostic.code));
app.mount(document.querySelector('[ui-app]'));
await app.ready;
app.afterFlush(()=>console.log('Initial bindings are ready'));
