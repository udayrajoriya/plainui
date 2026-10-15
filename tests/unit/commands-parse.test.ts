import {expect,test} from 'vitest';
import {parseCommands} from '../../packages/core/src/commands/parse.js';
import {parseEventDirective} from '../../packages/core/src/commands/handler.js';
test('commands accept quoted semicolons and pure nested expressions',()=>{const commands=parseCommands('set(count, count + 1); emit("hello;world", {"x": len(items)});');expect(commands).toHaveLength(2);expect(commands[0]!.writePath?.root).toBe('count');expect(commands[1]!.arguments).toHaveLength(2);});
test('commands reject statements, empty interiors and nested effects',()=>{for(const source of ['set(count, 1);;emit("x")','count = 1','set(count, emit("x"))','emit("x", set(count, 1))','obj.call()'])expect(()=>parseCommands(source)).toThrow();});
test('event descriptors reject duplicate/unknown modifiers, lifecycle modifiers and request conflicts',()=>{expect(parseEventDirective('data-ui-on:click.self.prevent')).toMatchObject({event:'click',self:true,prevent:true});for(const name of ['ui-on:click.once.once','ui-on:click.unknown','ui-on:success.once'])expect(()=>parseEventDirective(name)).toThrow();expect(()=>parseEventDirective('ui-on:submit',true)).toThrow();});
