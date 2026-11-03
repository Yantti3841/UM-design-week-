import site from './index.js';
import { enforceRetention } from '../server/retention.js';

export default {
 async fetch(request,env,ctx){
  const headers=new Headers(request.headers);
  for(const key of [...headers.keys()])if(key.startsWith('oai-authenticated-'))headers.delete(key);
  const url=new URL(request.url);
  if(url.pathname.startsWith('/api/admin/')){
   if(!ctx.access)return Response.json({error:'請先透過 Cloudflare Access 登入管理帳號。'},{status:401,headers:{'Cache-Control':'no-store'}});
   const identity=await ctx.access.getIdentity();
   if(!identity?.email||identity.email.toLowerCase()!==env.ADMIN_EMAIL?.toLowerCase())return Response.json({error:'此帳號沒有管理權限。'},{status:403});
   headers.set('oai-authenticated-user-id',identity.user_uuid||identity.email);
   headers.set('oai-authenticated-user-email',identity.email);
  }
  if(url.pathname==='/signin-with-chatgpt')return Response.redirect(new URL('/admin',url),302);
  if(url.pathname==='/signout-with-chatgpt')return Response.redirect(new URL('/cdn-cgi/access/logout',url),302);
  return site.fetch(new Request(request,{headers}),env,ctx);
 },
 async scheduled(controller,env,ctx){ctx.waitUntil(enforceRetention(env.DB));},
};
