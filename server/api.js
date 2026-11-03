import { Zip,ZipPassThrough,strToU8 } from 'fflate';
import { EVENT,GENERATOR_VERSION,validateRecipe,renderFlower } from './flower.js';
import { authorizeAdmin,handleAdmin } from './admin.js';
import {enforceRetention,exhibitionClosed} from './retention.js';
import {EXHIBITION_END} from '../src/event.js';

const json=(value,status=200)=>Response.json(value,{status,headers:{'Cache-Control':'no-store'}});
const publicRecord=row=>({id:row.submission_id,sequence:row.id,number:String(row.id).padStart(5,'0'),name:row.name,config:JSON.parse(row.recipe),createdAt:row.created_at,version:row.generator_version});

async function readFlowers(db,after=null,limit=60,revision=null,scope='wall'){
  await enforceRetention(db);
  const columns='id,submission_id,name,recipe,created_at,generator_version';
  const state=await db.prepare('SELECT revision FROM collection_state WHERE event_id=?').bind(EVENT).first();
  const currentRevision=state?.revision||0,reset=after===null||scope==='wall'&&revision!==null&&revision!==currentRevision;
  const cursor=reset?null:after,filter=scope==='archive'?"status!='trash'":"status='active'";
  const result=cursor===null
    ?await db.prepare(`SELECT ${columns} FROM flowers WHERE event_id=? AND ${filter} ORDER BY id DESC LIMIT ?`).bind(EVENT,limit).all()
    :await db.prepare(`SELECT ${columns} FROM flowers WHERE event_id=? AND ${filter} AND id>? ORDER BY id ASC LIMIT ?`).bind(EVENT,cursor,limit).all();
  const flowers=result.results.map(publicRecord).sort((a,b)=>a.sequence-b.sequence);
  return {flowers,cursor:flowers.at(-1)?.sequence??cursor??0,revision:currentRevision,reset};
}

// Reconcile each screen's cursor against shared D1; never rely on isolate-local broadcasts.
function connectWall(request,db){
  if(request.headers.get('Upgrade')?.toLowerCase()!=='websocket')return json({error:'WebSocket upgrade required'},426);
  const [client,server]=Object.values(new WebSocketPair());server.accept();
  let pending=false,last=0;
  server.addEventListener('message',async event=>{
    if(typeof event.data!=='string'||event.data.length>256){server.close(1008,'Invalid message');return;}
    if(pending||Date.now()-last<250)return;
    let message;
    try{message=JSON.parse(event.data);}catch{server.close(1008,'Invalid message');return;}
    if(message.type!=='sync'||!(message.after===null||Number.isSafeInteger(message.after)&&message.after>=0)||!(message.revision==null||Number.isSafeInteger(message.revision)&&message.revision>=0)){server.close(1008,'Invalid cursor');return;}
    pending=true;last=Date.now();
    try{const result=await readFlowers(db,message.after,60,message.revision??null);server.send(JSON.stringify({type:result.reset?'snapshot':'flowers',...result}));}
    catch(error){console.error('Wall sync:',error.message);server.close(1011,'Please reconnect');}
    finally{pending=false;}
  });
  return new Response(null,{status:101,webSocket:client});
}
export async function handleApi(request,env) {
  const url=new URL(request.url);
  const db=env.DB;
  if(!db)return json({error:'Collection storage is unavailable'},503);
  const closed=await enforceRetention(db);
  if(url.pathname==='/api/exhibition/status'&&request.method==='GET')return json({closed,endsAt:EXHIBITION_END,storedFlowers:closed?0:undefined});
  if(url.pathname==='/api/flowers'&&request.method==='POST'&&exhibitionClosed())return json({error:'The exhibition has ended. Collection is closed.'},410);
  if(request.headers.get('sec-fetch-site')==='cross-site')return json({error:'Use the event website'},403);
  if(url.pathname.startsWith('/api/admin/')){
    const identity=authorizeAdmin(request,env);if(identity instanceof Response)return identity;
    if(url.pathname==='/api/admin/archive.zip'&&request.method==='GET')return archiveResponse(db,true);
    return handleAdmin(request,env,identity);
  }
  if(url.pathname==='/api/wall'&&request.method==='GET')return connectWall(request,db);
  if(url.pathname==='/api/flowers'&&request.method==='POST'){
    if(!request.headers.get('Content-Type')?.startsWith('application/json'))return json({error:'Use application/json'},415);
    const reader=request.body?.getReader();let raw='',size=0;
    if(!reader)return json({error:'Missing flower'},400);
    const decoder=new TextDecoder();
    while(true){const chunk=await reader.read();if(chunk.done)break;size+=chunk.value.byteLength;if(size>8192){await reader.cancel();return json({error:'Flower is too large'},413);}raw+=decoder.decode(chunk.value,{stream:true});}
    raw+=decoder.decode();
    let body,recipe;
    try{
      body=JSON.parse(raw);
      if(typeof body.submissionId!=='string'||!/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(body.submissionId))throw Error('Invalid submission ID');
      recipe=validateRecipe(body.config);
    }catch(error){return json({error:error.message},400);}
    const existing=await db.prepare('SELECT id,submission_id,name,recipe,created_at,generator_version FROM flowers WHERE submission_id=? AND event_id=?').bind(body.submissionId,EVENT).first();
    if(existing){
      if(existing.recipe!==JSON.stringify(recipe))return json({error:'This submission ID belongs to another flower'},409);
      return json({flower:publicRecord(existing),saved:true});
    }
    const svg=renderFlower(recipe);
    const projection=renderFlower(recipe,{projection:true,animate:true});
    await db.prepare('INSERT INTO flowers (submission_id,event_id,name,recipe,svg,projection_svg,generator_version,created_at) VALUES (?,?,?,?,?,?,?,?) ON CONFLICT(submission_id) DO NOTHING').bind(body.submissionId,EVENT,recipe.name,JSON.stringify(recipe),svg,projection,GENERATOR_VERSION,new Date().toISOString()).run();
    const row=await db.prepare('SELECT id,submission_id,name,recipe,created_at,generator_version FROM flowers WHERE submission_id=? AND event_id=?').bind(body.submissionId,EVENT).first();
    if(row.recipe!==JSON.stringify(recipe))return json({error:'This submission ID belongs to another flower'},409);
    return json({flower:publicRecord(row),saved:true},201);
  }
  if(url.pathname==='/api/flowers'&&request.method==='GET'){
    const after=url.searchParams.get('after');
    const limit=Number(url.searchParams.get('limit')||60);
    if(after!==null&&(!/^\d+$/.test(after)||!Number.isSafeInteger(Number(after)))||!Number.isInteger(limit)||limit<1||limit>100)return json({error:'Invalid pagination'},400);
    const scope=url.searchParams.get('scope')||'wall';if(!['wall','archive'].includes(scope))return json({error:'Invalid scope'},400);
    return json(await readFlowers(db,after===null?null:Number(after),limit,null,scope));
  }
  const image=url.pathname.match(/^\/api\/flowers\/([0-9a-f-]{36})\/(original|projection)\.svg$/i);
  if(image&&request.method==='GET'){
    const row=await db.prepare(`SELECT ${image[2]==='original'?'svg':'projection_svg'} AS svg FROM flowers WHERE submission_id=? AND event_id=? AND status!='trash'`).bind(image[1],EVENT).first();
    if(!row)return json({error:'Flower not found'},404);
    return new Response(row.svg,{headers:{'Content-Type':'image/svg+xml; charset=utf-8','Cache-Control':'no-store','Content-Security-Policy':"default-src 'none'; style-src 'unsafe-inline'",'X-Content-Type-Options':'nosniff'}});
  }
  if(url.pathname==='/api/archive.zip'&&request.method==='GET')return archiveResponse(db);
  return json({error:'Not found'},404);
}
function archiveResponse(db,includeTrash=false) {
  let zip,done=false,cursor=0,rows=[],manifest=[];
  const stream=new ReadableStream({
    start(controller){zip=new Zip((error,data,final)=>{if(error){done=true;controller.error(error);return;}controller.enqueue(data);if(final){done=true;controller.close();}});},
    async pull(controller){
      if(done)return;
      try{
        if(!rows.length){
          const result=await db.prepare(`SELECT id,submission_id,name,recipe,svg,status,created_at,generator_version FROM flowers WHERE event_id=? AND id>?${includeTrash?'':" AND status!='trash'"} ORDER BY id ASC LIMIT 50`).bind(EVENT,cursor).all();
          rows=result.results;
          if(!rows.length){const file=new ZipPassThrough('manifest.json');zip.add(file);file.push(strToU8(JSON.stringify({event:EVENT,exportedAt:new Date().toISOString(),flowers:manifest},null,2)),true);zip.end();return;}
        }
        const row=rows.shift();cursor=row.id;
        const file=new ZipPassThrough(`flowers/UMDW-${String(row.id).padStart(5,'0')}.svg`);zip.add(file);file.push(strToU8(row.svg),true);
        manifest.push({...publicRecord(row),status:row.status});
      }catch(error){done=true;controller.error(error);}
    },
    cancel(){done=true;zip.terminate();},
  });
  return new Response(stream,{headers:{'Content-Type':'application/zip','Content-Disposition':`attachment; filename="UMDW-flowers-${new Date().toISOString().slice(0,10)}.zip"`,'Cache-Control':'no-store'}});
}
