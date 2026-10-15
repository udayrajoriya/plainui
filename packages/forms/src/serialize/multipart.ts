import type {ControlPair} from './successful-controls.js';

export function multipartControls(pairs:readonly ControlPair[]):FormData {const data=new FormData();for(const pair of pairs){if(pair.value instanceof File){if(pair.selectedFile)data.append(pair.name,pair.value,pair.value.name);}else data.append(pair.name,pair.value);}return data;}
