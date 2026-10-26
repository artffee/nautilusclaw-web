import {test} from 'node:test';
import assert from 'node:assert/strict';
import {safeDestination,loginMode} from '../login-core.mjs';
test('login redirects reject external URLs, encoded bypasses and sensitive URL material',()=>{
 for(const target of ['https://evil.invalid','//evil.invalid','/\\evil.invalid','/%2f%2fevil.invalid','/login','/parent\n','javascript:alert(1)',null]) assert.equal(safeDestination(target),'/parent');
 assert.equal(safeDestination('/app?token=private#private'),'/app');
 assert.equal(safeDestination('/billing?plan=yearly&redirect=https://evil.invalid'),'/billing?plan=yearly');
 assert.equal(safeDestination('/billing?plan=other'),'/billing');
 assert.equal(loginMode('unknown'),'signin');
});
