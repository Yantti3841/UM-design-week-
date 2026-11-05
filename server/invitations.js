import {DATA_USE_CONSENT_VERSION} from '../src/event.js';
import {EVENT} from './flower.js';
import {exhibitionClosed} from './retention.js';

const json=(value,status=200)=>Response.json(value,{status,headers:{'Cache-Control':'no-store'}});
const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
export async function recordInvitation(request,db){
 if(exhibitionClosed())return json({error:'The exhibition has ended.'},410);
 if(!request.headers.get('Content-Type')?.startsWith('application/json'))return json({error:'Use application/json'},415);
 const reader=request.body?.getReader();if(!reader)return json({error:'Missing creation'},400);
 const chunks=[];let size=0;
 while(true){const chunk=await reader.read();if(chunk.done)break;size+=chunk.value.length;if(size>1024){await reader.cancel();return json({error:'Request too large'},413);}chunks.push(chunk.value);}
 const bytes=new Uint8Array(size);let offset=0;for(const chunk of chunks){bytes.set(chunk,offset);offset+=chunk.length;}
 let body;try{body=JSON.parse(new TextDecoder().decode(bytes));}catch{return json({error:'Invalid creation'},400);}
 if(!uuid.test(body?.creationId)||!uuid.test(body?.visitorId)||body?.consentVersion!==DATA_USE_CONSENT_VERSION)return json({error:'Invalid creation or permission'},400);
 const createdAt=new Date(),expiresAt=new Date(createdAt);expiresAt.setUTCFullYear(expiresAt.getUTCFullYear()+2);
 const result=await db.prepare('INSERT INTO invitation_creations (creation_id,visitor_id,event_id,consent_version,created_at,expires_at) VALUES (?,?,?,?,?,?) ON CONFLICT(creation_id) DO NOTHING').bind(body.creationId,body.visitorId,EVENT,body.consentVersion,createdAt.toISOString(),expiresAt.toISOString()).run();
 const existing=await db.prepare('SELECT visitor_id FROM invitation_creations WHERE creation_id=? AND event_id=?').bind(body.creationId,EVENT).first();
 if(existing?.visitor_id!==body.visitorId)return json({error:'Creation ID already used'},409);
 return json({recorded:true},result.meta.changes?201:200);
}
