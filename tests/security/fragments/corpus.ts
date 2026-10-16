import {FRAGMENT_ATTRIBUTES,FRAGMENT_TAGS} from '../../../packages/schema/src/allowlists.js';

export const allowedTags=Object.freeze([...FRAGMENT_TAGS].sort());
export const allowedAttributes=Object.freeze([...FRAGMENT_ATTRIBUTES].sort());
export const tagWrappers:Readonly<Record<string,string>>=Object.freeze({caption:'table',col:'table><colgroup',colgroup:'table',tbody:'table',thead:'table',tr:'table><tbody',td:'table><tbody><tr',th:'table><thead><tr',option:'select',optgroup:'select',legend:'fieldset',li:'ul',dd:'dl',dt:'dl'});
export const attributeHosts:Readonly<Record<string,string>>=Object.freeze({href:'a',target:'a',rel:'a',src:'img',alt:'img',width:'img',height:'img',name:'input',value:'input',type:'input',disabled:'input',required:'input',readonly:'input',multiple:'select',checked:'input',selected:'option',placeholder:'input',min:'input',max:'input',step:'input',pattern:'input',for:'label',action:'form',method:'form',enctype:'form',colspan:'th',rowspan:'th',scope:'th',datetime:'time',open:'details'});
export const attributeValues:Readonly<Record<string,string>>=Object.freeze({id:'safe-id',class:'safe-class',title:'safe',lang:'en',dir:'ltr',role:'note',href:'/safe',target:'_self',rel:'author',src:'/safe.png',alt:'safe',width:'10',height:'10',name:'safe-name',value:'safe',type:'text',disabled:'',required:'',readonly:'',multiple:'',checked:'',selected:'',placeholder:'safe',min:'0',max:'10',step:'1',pattern:'[a-z]+',for:'safe-id',action:'/submit',method:'post',enctype:'application/x-www-form-urlencoded',colspan:'2',rowspan:'2',scope:'col',datetime:'2026-10-16',open:'',hidden:'',tabindex:'0',slot:'content'});

export const forbiddenCorpus=Object.freeze([
  {name:'script-subtree',markup:'<script>globalThis.__fragmentExecuted=1</script><p>safe</p>',forbidden:'script'},
  {name:'event-style-srcdoc',markup:'<img onerror="globalThis.__fragmentExecuted=1" style="x" srcdoc="bad">',forbidden:'[onerror],[style],[srcdoc]'},
  {name:'encoded-javascript',markup:'<a href="java&#x73;cript:globalThis.__fragmentExecuted=1">x</a>',forbidden:'[href]'},
  {name:'mixed-javascript',markup:'<a href="JaVaScRiPt:globalThis.__fragmentExecuted=1">x</a>',forbidden:'[href]'},
  {name:'controlled-javascript',markup:'<a href="java&#10;script:globalThis.__fragmentExecuted=1">x</a>',forbidden:'[href]'},
  {name:'namespace-confusion',markup:'<svg><foreignObject><script>bad</script></foreignObject></svg><math><mtext>bad</mtext></math>',forbidden:'svg,math,script'},
  {name:'metadata-embed',markup:'<base href="https://evil.test/"><meta http-equiv="refresh" content="0;url=/beacon"><iframe src="/beacon"></iframe>',forbidden:'base,meta,iframe'},
  {name:'directive-bypass',markup:'<p DATA-UI-TEXT="x" data-ui-on:click="bad" ui-state="{}">safe</p>',forbidden:'[data-ui-text],[data-ui-on\\:click],[ui-state]'},
  {name:'custom-template',markup:'<x-evil ui-prop-x="bad"><template ui-if="x">bad</template></x-evil>',forbidden:'x-evil,template,[ui-prop-x],[ui-if]'},
  {name:'dom-clobber',markup:'<form id="constructor" name="__proto__"><input name="attributes"></form>',forbidden:'[id="constructor"],[name="__proto__"],[name="attributes"]'},
  {name:'mutation-xss',markup:'<math><mtext><table><mglyph><style><!--</style><img title="--><img src=1 onerror=globalThis.__fragmentExecuted=1>">',forbidden:'math,style,[onerror]'},
  {name:'foster-parenting',markup:'<table><style><img src=x onerror=globalThis.__fragmentExecuted=1></style><tr><td>safe</td></tr></table>',forbidden:'style,[onerror]'},
]);
