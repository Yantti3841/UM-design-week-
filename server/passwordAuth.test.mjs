import test from 'node:test';
import assert from 'node:assert/strict';
import {hashPassword,handlePasswordLogin,sessionIdentity} from './passwordAuth.js';
const password='test-only-long-password';
const env={ADMIN_EMAIL:'admin@example.test',ADMIN_PASSWORD_SALT:'test-salt',ADMIN_SESSION_SECRET:'test-session-secret',LOGIN_LIMITER:{limit:async()=>({success:true})}};
env.ADMIN_PASSWORD_HASH=await hashPassword(password,env.ADMIN_PASSWORD_SALT);
const form=(value,origin='https://admin.example.test')=>new Request('https://admin.example.test/admin/login',{method:'POST',headers:{origin,'content-type':'application/x-www-form-urlencoded'},body:new URLSearchParams({password:value})});
test('valid password issues a secure cookie; tampered and expired sessions fail',async()=>{
 const result=await handlePasswordLogin(form(password),env);assert.equal(result.status,303);
 const cookie=result.headers.get('set-cookie');for(const flag of ['HttpOnly','Secure','SameSite=Strict','Path=/'])assert.ok(cookie.includes(flag));
 const request=new Request('https://admin.example.test/api/admin/session',{headers:{cookie}});
 assert.equal((await sessionIdentity(request,env)).email,env.ADMIN_EMAIL);
 assert.equal(await sessionIdentity(request,env,Date.now()+9*3600000),null);
 assert.equal(await sessionIdentity(new Request('https://other.example.test/api/admin/session',{headers:{cookie}}),env),null);
 const tampered=cookie.replace(/=./,'=X');assert.equal(await sessionIdentity(new Request(request,{headers:{cookie:tampered}}),env),null);
});
test('wrong password, cross-origin login and rate limits are rejected',async()=>{
 assert.equal((await handlePasswordLogin(form('wrong'),env)).status,401);
 assert.equal((await handlePasswordLogin(form(password,'https://attacker.example'),env)).status,403);
 assert.equal((await handlePasswordLogin(form(password),{...env,LOGIN_LIMITER:{limit:async()=>({success:false})}})).status,429);
});
