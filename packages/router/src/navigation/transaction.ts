import type {RouteRecord} from '@plainui/runtime-bridge';
import type {RouteMatch} from '../match.js';

export interface PreparedNavigation {readonly generation:number;readonly from:RouteRecord|null;readonly to:RouteRecord;readonly url:URL;readonly match:RouteMatch;readonly historyIntent:'push'|'replace'|'traverse';readonly signal:AbortSignal}
