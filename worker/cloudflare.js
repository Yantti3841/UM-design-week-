import site from './index.js';
import { sessionIdentity,handlePasswordLogin } from '../server/passwordAuth.js';
import { enforceRetention } from '../server/retention.js';

export default {
 async fetch(request,env,ctx){
  const headers=new Headers(request.headers);
  for(const key of [...headers.keys()])if(key.startsWith('oai-authenticated-'))headers.delete(key);
  const url=new URL(request.url);
  const login=await handlePasswordLogin(request,env);if(login)return login;
  const identity=await sessionIdentity(request,env);
  if(url.pathname==='/admin'&&!identity)return new Response(null,{status:303,headers:{Location:'/admin/login','Cache-Control':'no-store'}});
  if(url.pathname.startsWith('/api/admin/')){
   if(!identity)return Response.json({error:'請先登入管理平台。'},{status:401,headers:{'Cache-Control':'no-store'}});
   headers.set('oai-authenticated-user-id',identity.userId);
   headers.set('oai-authenticated-user-email',identity.email);
  }
  return site.fetch(new Request(request,{headers}),env,ctx);
 },
 async scheduled(controller,env,ctx){ctx.waitUntil(enforceRetention(env.DB));},
};
