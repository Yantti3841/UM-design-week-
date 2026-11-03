import test from 'node:test';
import assert from 'node:assert/strict';
globalThis.__STATIC_ASSETS__={};
const {default:worker}=await import('../worker/cloudflare.js');
test('forged identity headers never grant administrator access',async()=>{
 const response=await worker.fetch(new Request('https://example.workers.dev/api/admin/session',{headers:{'oai-authenticated-user-id':'forged','oai-authenticated-user-email':'admin@example.com'}}),{ADMIN_EMAIL:'admin@example.com'},{});
 assert.equal(response.status,401);
});
test('authenticated Access identity must match the administrator',async()=>{
 const response=await worker.fetch(new Request('https://example.workers.dev/api/admin/session'),{ADMIN_EMAIL:'admin@example.com'},{access:{getIdentity:async()=>({email:'other@example.com'})}});
 assert.equal(response.status,403);
});
