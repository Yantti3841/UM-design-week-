const encoder=new TextEncoder();
const cookieName='__Host-umdw_admin';
const lifetime=8*60*60;
const hex=buffer=>Array.from(new Uint8Array(buffer),n=>n.toString(16).padStart(2,'0')).join('');
const base64=bytes=>btoa(String.fromCharCode(...new Uint8Array(bytes))).replaceAll('+','-').replaceAll('/','_').replace(/=+$/,'');
const unbase64=value=>Uint8Array.from(atob(value.replaceAll('-','+').replaceAll('_','/')),c=>c.charCodeAt(0));
const response=(body,status=200,headers={})=>new Response(body,{status,headers:{'Cache-Control':'no-store','X-Content-Type-Options':'nosniff',...headers}});
async function key(secret){return crypto.subtle.importKey('raw',encoder.encode(secret),{name:'HMAC',hash:'SHA-256'},false,['sign','verify']);}
export async function hashPassword(password,salt){
 const material=await crypto.subtle.importKey('raw',encoder.encode(password),'PBKDF2',false,['deriveBits']);
 return hex(await crypto.subtle.deriveBits({name:'PBKDF2',hash:'SHA-256',salt:encoder.encode(salt),iterations:100000},material,256));
}
const ready=env=>env.ADMIN_PASSWORD_HASH&&env.ADMIN_PASSWORD_SALT&&env.ADMIN_SESSION_SECRET;
export async function sessionIdentity(request,env,now=Date.now()){
 if(!ready(env))return null;
 const token=request.headers.get('cookie')?.split(';').map(x=>x.trim()).find(x=>x.startsWith(cookieName+'='))?.slice(cookieName.length+1);
 if(!token||token.length>1024)return null;
 try{
  const [payload,signature,...rest]=token.split('.');if(rest.length||!payload||!signature)return null;
  if(!await crypto.subtle.verify('HMAC',await key(env.ADMIN_SESSION_SECRET),unbase64(signature),encoder.encode(payload)))return null;
  const data=JSON.parse(new TextDecoder().decode(unbase64(payload)));
  if(data.origin!==new URL(request.url).origin||!Number.isInteger(data.expires)||data.expires<=now||data.expires>now+lifetime*1000)return null;
  return {email:env.ADMIN_EMAIL,userId:'password-admin'};
 }catch{return null;}
}
const cookie=(value,seconds)=>`${cookieName}=${value}; Path=/; Secure; HttpOnly; SameSite=Strict; Max-Age=${seconds}`;
const loginPage=message=>`<!doctype html><html lang="zh-Hant"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>管理平台登入</title><style>body{margin:0;background:#e7e8eb;color:#182a25;font:16px Arial,sans-serif;min-height:100dvh;display:grid;place-items:center}main{width:min(360px,calc(100% - 48px));padding:40px 0}h1{font-size:30px;font-weight:400}p{line-height:1.8}input,button{box-sizing:border-box;display:block;width:100%;font:inherit;border-radius:0;padding:14px;margin:14px 0}input{background:transparent;border:1px solid #182a25}button{background:#182a25;color:white;border:0;cursor:pointer}small{opacity:.65}</style><main><small>UMDW 2026 · ADMIN</small><h1>管理平台登入</h1><p>${message||'請輸入您的管理員密碼。'}</p><form method="post" action="/admin/login"><label for="password">管理員密碼</label><input id="password" name="password" type="password" autocomplete="current-password" required maxlength="256"><button type="submit">登入</button></form></main></html>`;
export async function handlePasswordLogin(request,env){
 const url=new URL(request.url);
 if(url.pathname==='/admin/logout'||url.pathname==='/signout-with-chatgpt')return response(null,303,{'Location':'/admin/login','Set-Cookie':cookie('',0)});
 if(url.pathname!=='/admin/login'&&url.pathname!=='/signin-with-chatgpt')return null;
 const page=(message,status=200)=>response(loginPage(message),status,{'Content-Type':'text/html; charset=utf-8','Content-Security-Policy':"default-src 'none'; style-src 'unsafe-inline'; form-action 'self'; frame-ancestors 'none'; base-uri 'none'"});
 if(request.method==='GET')return page(ready(env)?'':'管理員密碼尚未設定，請聯絡網站管理者。');
 if(request.method!=='POST')return response('Method not allowed',405,{'Allow':'GET, POST'});
 if(request.headers.get('origin')!==url.origin)return response('Forbidden',403);
 if(!ready(env)||!env.LOGIN_LIMITER)return page('登入服務尚未設定完成。',503);
 const limited=await env.LOGIN_LIMITER.limit({key:'admin-login:'+request.headers.get('cf-connecting-ip')});
 if(!limited.success)return page('嘗試次數過多，請稍後再試。',429);
 if(!request.headers.get('content-type')?.startsWith('application/x-www-form-urlencoded'))return response('Invalid form',415);
 const reader=request.body?.getReader();if(!reader)return response('Invalid form',400);
 let chunks=[],size=0;while(true){const item=await reader.read();if(item.done)break;size+=item.value.length;if(size>2048){await reader.cancel();return response('Too large',413);}chunks.push(item.value);}
 const data=new Uint8Array(size);let offset=0;for(const part of chunks){data.set(part,offset);offset+=part.length;}
 const password=new URLSearchParams(new TextDecoder().decode(data)).get('password');
 if(!password||password.length>256)return page('密碼不正確。',401);
 const derived=await hashPassword(password,env.ADMIN_PASSWORD_SALT);let diff=derived.length^env.ADMIN_PASSWORD_HASH.length;
 for(let i=0;i<derived.length;i++)diff|=derived.charCodeAt(i)^(env.ADMIN_PASSWORD_HASH.charCodeAt(i)||0);
 if(diff)return page('密碼不正確。',401);
 const payload=base64(encoder.encode(JSON.stringify({origin:url.origin,expires:Date.now()+lifetime*1000,nonce:crypto.randomUUID()})));
 const signature=base64(await crypto.subtle.sign('HMAC',await key(env.ADMIN_SESSION_SECRET),encoder.encode(payload)));
 return response(null,303,{'Location':'/admin','Set-Cookie':cookie(payload+'.'+signature,lifetime)});
}
