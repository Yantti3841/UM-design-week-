import assert from 'node:assert/strict';
import {test} from 'node:test';
import {Miniflare} from 'miniflare';
import {enforceRetention,exhibitionClosed} from './retention.js';
import {handleApi} from './api.js';

test('legacy submissions expire after the exhibition; new consent expires individually after two years',async()=>{
 const mf=new Miniflare({modules:true,script:'export default {fetch(){return new Response("test")}}',compatibilityDate:'2026-07-01',host:'127.0.0.1',port:17603,d1Databases:{DB:'retention-check'},d1Persist:false,cf:false});
 try{
  await mf.ready;const db=await mf.getD1Database('DB');
  await db.prepare('CREATE TABLE flowers (event_id TEXT,name TEXT,status TEXT,consent_version TEXT,expires_at TEXT)').run();
  await db.prepare('CREATE TABLE invitation_creations (event_id TEXT,expires_at TEXT)').run();
  await db.prepare("INSERT INTO invitation_creations VALUES ('umdw-2026','2028-11-05T11:00:00.000Z')").run();
  await db.prepare('CREATE TABLE collection_state (event_id TEXT PRIMARY KEY, revision INTEGER)').run();
  await db.prepare("INSERT INTO flowers VALUES ('umdw-2026','synthetic','trash',NULL,NULL),('umdw-2026','synthetic2','active',NULL,NULL),('umdw-2026','new-consent','active','data-use-2026-11-05-v1','2028-11-05T11:00:00.000Z'),('umdw-2026','later-consent','trash','data-use-2026-11-05-v1','2028-11-06T11:00:00.000Z')").run();
  const cutoff=Date.parse('2026-11-18T00:00:00+08:00');
  assert.equal(exhibitionClosed(cutoff-1),false);assert.equal(await enforceRetention(db,cutoff-1),false);
  assert.equal((await db.prepare('SELECT COUNT(*) AS n FROM flowers').first()).n,4);
  assert.equal(await enforceRetention(db,cutoff),true);assert.equal((await db.prepare('SELECT COUNT(*) AS n FROM flowers').first()).n,2);
  assert.equal((await db.prepare('SELECT revision FROM collection_state').first()).revision,1);
  await enforceRetention(db,cutoff+1000);assert.equal((await db.prepare('SELECT revision FROM collection_state').first()).revision,1);
  const firstExpiry=Date.parse('2028-11-05T11:00:00.000Z');
  await enforceRetention(db,firstExpiry-1);assert.equal((await db.prepare('SELECT COUNT(*) AS n FROM flowers').first()).n,2);
  await enforceRetention(db,firstExpiry);assert.equal((await db.prepare('SELECT COUNT(*) AS n FROM invitation_creations').first()).n,0);assert.equal((await db.prepare('SELECT COUNT(*) AS n FROM flowers').first()).n,1);
  await enforceRetention(db,Date.parse('2028-11-06T11:00:00.000Z'));assert.equal((await db.prepare('SELECT COUNT(*) AS n FROM flowers').first()).n,0);
  assert.equal((await db.prepare('SELECT revision FROM collection_state').first()).revision,3);
  const clock=Date.now;try{Date.now=()=>cutoff;const response=await handleApi(new Request('http://localhost/api/flowers',{method:'POST'}),{DB:db});assert.equal(response.status,410);}finally{Date.now=clock;}
 }finally{await mf.dispose();}
});
