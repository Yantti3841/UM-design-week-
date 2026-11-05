import {DATA_USE_CONSENT_VERSION} from './event.js';

const fallback=new Map();
function persistentId(key){
 let id;try{id=localStorage.getItem(key);}catch{}
 if(!id)id=fallback.get(key)||crypto.randomUUID();
 fallback.set(key,id);try{localStorage.setItem(key,id);}catch{}
 return id;
}
export async function recordInvitationCreation(config){
 const hash=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(JSON.stringify(config)));
 const key=[...new Uint8Array(hash)].map(n=>n.toString(16).padStart(2,'0')).join('');
 const body=JSON.stringify({creationId:persistentId('umdw-invitation:'+key),visitorId:persistentId('umdw-invitation-visitor'),consentVersion:DATA_USE_CONSENT_VERSION});
 for(let attempt=0;attempt<3;attempt++){
  try{
   const response=await fetch('/api/invitations',{method:'POST',headers:{'Content-Type':'application/json'},body,signal:AbortSignal.timeout(10000)});
   if(response.ok)return;
   if(response.status<500)return;
  }catch{}
  if(attempt<2)await new Promise(resolve=>setTimeout(resolve,1000*(attempt+1)));
 }
}
