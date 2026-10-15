import type {CacheInvalidator} from './cache/invalidate.js';
import type {FlightCoordinator} from './coordinator/flight.js';

/** The app advances authEpoch before calling this root-local cleanup. */
export function resetDataSession<T>(flights:FlightCoordinator<T>,invalidator:CacheInvalidator,resources:Iterable<{resetSession():void}>):void {flights.cancelAll();invalidator.clear();for(const resource of resources)resource.resetSession();}
