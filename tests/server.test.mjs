import {test} from 'node:test';
import assert from 'node:assert/strict';
import {once} from 'node:events';
import {createSignalProofServer} from '../server.mjs';
import {demo} from '../engine.mjs';

test('real HTTP server enforces origin, body limit, private-file allowlist, and module delivery',async()=>{
  const server=createSignalProofServer();server.listen(0,'127.0.0.1');await once(server,'listening');
  const url=`http://127.0.0.1:${server.address().port}`;
  try{
    const blocked=await fetch(`${url}/api/analyze`,{method:'POST',headers:{Origin:'https://unrelated.example','Content-Type':'application/json'},body:JSON.stringify({rows:demo()})});
    assert.equal(blocked.status,403);
    const good=await fetch(`${url}/api/analyze`,{method:'POST',headers:{Origin:url,'Content-Type':'application/json'},body:JSON.stringify({rows:demo('hum')})});
    assert.equal(good.status,200);
    assert.equal((await good.json()).report.findings[0].id,'hum');
    const huge=await fetch(`${url}/api/analyze`,{method:'POST',body:JSON.stringify({extra:'x'.repeat(2_000_001)})});
    assert.equal(huge.status,413);
    for(const path of ['/.env','/api/analyze.mjs','/tests/engine.test.mjs'])assert.equal((await fetch(url+path)).status,404);
    const module=await fetch(`${url}/comparison.mjs`);
    assert.equal(module.status,200);
    assert.match(module.headers.get('content-type'),/javascript/);
    const page=await fetch(url);
    assert.match(page.headers.get('content-security-policy'),/connect-src 'self'/);
  }finally{server.closeAllConnections();await new Promise(resolve=>server.close(resolve));}
});
