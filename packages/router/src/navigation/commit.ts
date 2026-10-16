import {PlainUIError} from '../../../core/src/index.js';
import type {NavigationPreparer} from './prepare.js';
import type {PreparedNavigation} from './transaction.js';
import type {RouteView} from '../view.js';

export interface CommitIntent {readonly writeHistory:(transaction:PreparedNavigation)=>boolean;readonly live:()=>boolean}
export function commitNavigation<Scope>(preparer:NavigationPreparer,transaction:PreparedNavigation,view:RouteView<Scope>,intent:CommitIntent):Scope|null {if(!intent.live()||!preparer.isCurrent(transaction))return null;let prepared;try{prepared=view.prepare(transaction.match);}catch(error){throw error instanceof PlainUIError?error:new PlainUIError('ROUTE_INVALID');}if(!intent.live()||!preparer.isCurrent(transaction))return null;if(!intent.writeHistory(transaction))return null;return view.commit(prepared);}
