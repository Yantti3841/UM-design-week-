import assert from 'node:assert/strict';
import {test} from 'node:test';
import {Miniflare} from 'miniflare';
import {enforceRetention,exhibitionClosed} from './retention.js';
import {handleApi} from './api.js';

test('retention preserves data until the cutoff, then removes active and recycled data once',async()=>{
 const mf=new Miniflare({modules:true,script:'export default {fetch(){return new Response("test")}}',compatibilityDate:'2026-07-01',host:'127.0.0.1',port:17603,d1Databases:{DB:'retention-check'},d1Persist:false,cf:false});
 try{
  await mf.ready;const db=await mf.getD1Database('DB');
  await db.prepare('CREATE TABLE flowers (event_id TEXT,name TEXT,status TEXT)').run();
  await db.prepare('CREATE TABLE collection_state (event_id TEXT PRIMARY KEY, revision INTEGER)').run();
  await db.prepare("INSERT INTO flowers VALUES ('umdw-2026','synthetic','trash'),('umdw-2026','synthetic2','active')").run();
  const cutoff=Date.parse('2026-11-18T00:00:00+08:00');
  assert.equal(exhibitionClosed(cutoff-1),false);assert.equal(await enforceRetention(db,cutoff-1),false);
  assert.equal((await db.prepare('SELECT COUNT(*) AS n FROM flowers').first()).n,2);
  assert.equal(await enforceRetention(db,cutoff),true);assert.equal((await db.prepare('SELECT COUNT(*) AS n FROM flowers').first()).n,0);
  assert.equal((await db.prepare('SELECT revision FROM collection_state').first()).revision,1);
  await enforceRetention(db,cutoff+1000);assert.equal((await db.prepare('SELECT revision FROM collection_state').first()).revision,1);
  const clock=Date.now;try{Date.now=()=>cutoff;const response=await handleApi(new Request('http://localhost/api/flowers',{method:'POST'}),{DB:db});assert.equal(response.status,410);}finally{Date.now=clock;}
 }finally{await mf.dispose();}
});
