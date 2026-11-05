import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {test} from 'node:test';
import {Miniflare} from 'miniflare';
import {handleApi} from './api.js';
import {defaultConfig} from '../src/generator.js';
import {DATA_USE_CONSENT_VERSION} from '../src/event.js';

test('submissions record the accepted permission and two-year expiry without extending legacy permission',async()=>{
 const mf=new Miniflare({modules:true,script:'export default {fetch(){return new Response("test")}}',compatibilityDate:'2026-07-01',host:'127.0.0.1',port:17612,d1Databases:{DB:'consent-check'},d1Persist:false,cf:false});
 try{
  await mf.ready;const db=await mf.getD1Database('DB');
  for(const file of ['0000_icy_post.sql','0001_tricky_thanos.sql','0002_data_use_consent.sql'])for(const statement of (await readFile('drizzle/'+file,'utf8')).split('--> statement-breakpoint').filter(s=>s.trim()))await db.prepare(statement).run();
  const config={...defaultConfig,motion:'still',name:'consent test'};
  const submit=body=>handleApi(new Request('https://event.test/api/flowers',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({submissionId:crypto.randomUUID(),config,...body})}),{DB:db});
  assert.equal((await submit({consentVersion:DATA_USE_CONSENT_VERSION})).status,201);
  assert.equal((await submit({})).status,201);
  assert.equal((await submit({consentVersion:'invalid'})).status,400);
  const rows=(await db.prepare('SELECT consent_version,expires_at,created_at FROM flowers ORDER BY id').all()).results;
  assert.equal(rows[0].consent_version,DATA_USE_CONSENT_VERSION);
  const expiry=new Date(rows[0].created_at);expiry.setUTCFullYear(expiry.getUTCFullYear()+2);
  assert.equal(rows[0].expires_at,expiry.toISOString());assert.equal(rows[1].expires_at,null);assert.equal(rows[1].consent_version,null);
 }finally{await mf.dispose();}
});
