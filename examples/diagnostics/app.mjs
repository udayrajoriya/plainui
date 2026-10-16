import {PlainUI} from '../../dist/plainui.mjs';

const app=PlainUI.mount(document.querySelector('[ui-app]'),{debug:true});
const output=document.querySelector('#snapshot');
function render(){output.textContent=JSON.stringify(app.inspect(),null,2);}
document.querySelector('#refresh').addEventListener('click',render);
await app.ready;
render();
