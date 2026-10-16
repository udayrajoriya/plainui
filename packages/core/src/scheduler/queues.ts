export const PHASES=['derived','structure','bindings','accessibility','behaviors','afterFlush'] as const;
export type Phase=typeof PHASES[number];
export interface Job {readonly owner?:{readonly active:boolean};run():void}
export type Queues=Record<Phase,Set<Job>>;
export function emptyQueues():Queues {return {derived:new Set(),structure:new Set(),bindings:new Set(),accessibility:new Set(),behaviors:new Set(),afterFlush:new Set()};}
export function hasJobs(queues:Queues):boolean {return PHASES.some(phase=>queues[phase].size>0);}
