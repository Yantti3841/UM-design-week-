import assert from 'node:assert/strict';
import {readFile,readdir} from 'node:fs/promises';
import {test} from 'node:test';
import {Miniflare} from 'miniflare';
import {handleApi} from './api.js';
import {DATA_USE_CONSENT_VERSION} from '../src/event.js';

test('invitation completions are idempotent, count anonymous visitors, and keep statistics private',async()=>{
 const mf=new Miniflare({modules:true,script:'export default {fetch(){return new Response("test")}}',compatibilityDate:'2026-07-01',host:'127.0.0.1',port:17613,d1Databases:{DB:'invitations-check'},d1Persist:false,cf:false});
 try{
  await mf.ready;const db=await mf.getD1Database('DB'),env={DB:db,ADMIN_EMAIL:'admin@example.com',PUBLIC_ORIGIN:'https://event.test'};
  for(const file of (await readdir('drizzle')).filter(f=>f.endsWith('.sql')).sort())for(const sql of (await readFile('drizzle/'+file,'utf8')).split('--> statement-breakpoint').filter(s=>s.trim()))await db.prepare(sql).run();
  const body={creationId:crypto.randomUUID(),visitorId:crypto.randomUUID(),consentVersion:DATA_USE_CONSENT_VERSION};
  const post=(data,headers={})=>handleApi(new Request('https://event.test/api/invitations',{method:'POST',headers:{'Content-Type':'application/json',...headers},body:JSON.stringify(data)}),env);
  assert.equal((await post({...body,consentVersion:null})).status,400);
  assert.equal((await post({...body,visitorId:'invalid'})).status,400);
  assert.equal((await post({...body,padding:'x'.repeat(1100)})).status,413);
  assert.equal((await post(body,{'sec-fetch-site':'cross-site',Origin:'https://other.test'})).status,403);
  assert.equal((await post(body)).status,201);
  assert.equal((await post(body)).status,200);
  assert.equal((await post({...body,visitorId:crypto.randomUUID()})).status,409);
  assert.equal((await post({...body,creationId:crypto.randomUUID()})).status,201);
  assert.equal((await post({...body,creationId:crypto.randomUUID(),visitorId:crypto.randomUUID()})).status,201);
  assert.equal((await handleApi(new Request('https://event.test/api/admin/invitations/stats'),env)).status,401);
  const response=await handleApi(new Request('https://event.test/api/admin/invitations/stats',{headers:{'oai-authenticated-user-id':'test-admin','oai-authenticated-user-email':'admin@example.com'}}),env);
  const stats=await response.json();assert.equal(stats.creations,3);assert.equal(stats.visitors,2);
  const row=await db.prepare('SELECT * FROM invitation_creations WHERE creation_id=?').bind(body.creationId).first();
  const expiry=new Date(row.created_at);expiry.setUTCFullYear(expiry.getUTCFullYear()+2);assert.equal(row.expires_at,expiry.toISOString());
 }finally{await mf.dispose();}
});

test('client reuses creation IDs for identical cards and an anonymous ID for the same browser',async()=>{
 const storage=new Map(),requests=[];
 globalThis.localStorage={getItem:key=>storage.get(key)||null,setItem:(key,value)=>storage.set(key,value)};
 const originalFetch=globalThis.fetch;
 globalThis.fetch=async(url,options)=>{requests.push(JSON.parse(options.body));return new Response('{}',{status:201});};
 try{
  const {recordInvitationCreation}=await import('../src/invitationStats.js');
  await recordInvitationCreation({palette:0});await recordInvitationCreation({palette:0});await recordInvitationCreation({palette:1});
  assert.equal(requests[0].creationId,requests[1].creationId);assert.notEqual(requests[0].creationId,requests[2].creationId);
  assert.equal(new Set(requests.map(r=>r.visitorId)).size,1);
 }finally{globalThis.fetch=originalFetch;delete globalThis.localStorage;}
});
