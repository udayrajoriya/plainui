/** Native composition events gate model writes until the final committed text. */
export class CompositionGate {active=false;start():void {this.active=true;}end():void {this.active=false;}}
