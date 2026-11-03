import { EVENT } from './flower.js';

const json=(value,status=200)=>Response.json(value,{status,headers:{'Cache-Control':'private, no-store'}});
const columns='id,submission_id,name,recipe,status,updated_at,created_at,generator_version';
const record=row=>({id:row.submission_id,sequence:row.id,number:String(row.id).padStart(5,'0'),name:row.name,config:JSON.parse(row.recipe),status:row.status,updatedAt:row.updated_at,createdAt:row.created_at,version:row.generator_version});

export function authorizeAdmin(request,env){
  const userId=request.headers.get('oai-authenticated-user-id'),email=request.headers.get('oai-authenticated-user-email');
  if(!userId||!email)return json({error:'请先登录管理员账号。'},401);
  if(!env.ADMIN_EMAIL)return json({error:'管理后台尚未配置。'},503);
  if(email.toLowerCase()!==env.ADMIN_EMAIL.trim().toLowerCase())return json({error:'当前账号没有管理权限，请切换管理员账号。'},403);
  return {userId,email};
}

export async function handleAdmin(request,env,identity){
  const url=new URL(request.url),db=env.DB;
  if(url.pathname==='/api/admin/session'&&request.method==='GET')return json({admin:{email:identity.email}});
  if(url.pathname==='/api/admin/flowers'&&request.method==='GET'){
    const status=url.searchParams.get('status')||'all',q=(url.searchParams.get('q')||'').trim(),before=Number(url.searchParams.get('before')||Number.MAX_SAFE_INTEGER);
    if(!['all','active','hidden','trash'].includes(status)||q.length>80||!Number.isSafeInteger(before)||before<1)return json({error:'筛选条件无效。'},400);
    const escaped=q.replace(/[\\%_]/g,'\\$&'),search=q?` AND (name LIKE ? ESCAPE '\\' OR id=?)`:'',state=status==='all'?'':` AND status=?`;
    const bindings=[EVENT,before,...(status==='all'?[]:[status]),...(q?[`%${escaped}%`,/^\d+$/.test(q)?Number(q):-1]:[])];
    const [page,totals]=await db.batch([
      db.prepare(`SELECT ${columns} FROM flowers WHERE event_id=? AND id<?${state}${search} ORDER BY id DESC LIMIT 25`).bind(...bindings),
      db.prepare('SELECT status,COUNT(*) AS count FROM flowers WHERE event_id=? GROUP BY status').bind(EVENT),
    ]);
    const flowers=page.results.slice(0,24).map(record),counts={all:0,active:0,hidden:0,trash:0};
    for(const row of totals.results){counts[row.status]=row.count;counts.all+=row.count;}
    return json({flowers,counts,nextCursor:page.results.length>24?flowers.at(-1).sequence:null});
  }
  const target=url.pathname.match(/^\/api\/admin\/flowers\/([0-9a-f-]{36})$/i);
  if(target&&request.method==='PATCH'){
    if(request.headers.get('origin')!==url.origin)return json({error:'请从管理页面执行操作。'},403);
    if(!request.headers.get('content-type')?.startsWith('application/json'))return json({error:'请求格式无效。'},415);
    const raw=await request.text();if(raw.length>512)return json({error:'请求过大。'},413);
    let body;try{body=JSON.parse(raw);}catch{return json({error:'请求格式无效。'},400);}
    if(!['hide','show','trash','restore'].includes(body.action)||!['active','hidden','trash'].includes(body.status)||!(body.updatedAt===null||typeof body.updatedAt==='string'&&body.updatedAt.length<40))return json({error:'操作无效。'},400);
    const current=await db.prepare(`SELECT ${columns},restore_status FROM flowers WHERE submission_id=? AND event_id=?`).bind(target[1],EVENT).first();
    if(!current)return json({error:'找不到这朵花。'},404);
    if(current.status!==body.status||current.updated_at!==body.updatedAt)return json({error:'作品状态已更新，请刷新后重试。'},409);
    const allowed={hide:['active'],show:['hidden'],trash:['active','hidden'],restore:['trash']};
    if(!allowed[body.action].includes(current.status))return json({error:'当前状态无法执行这个操作。'},409);
    const status=body.action==='hide'?'hidden':body.action==='show'?'active':body.action==='trash'?'trash':current.restore_status;
    const updatedAt=new Date().toISOString(),restoreStatus=body.action==='trash'?current.status:current.restore_status;
    const result=await db.batch([
      db.prepare('UPDATE flowers SET status=?,restore_status=?,updated_at=? WHERE submission_id=? AND event_id=? AND status=? AND updated_at IS ?').bind(status,restoreStatus,updatedAt,target[1],EVENT,current.status,current.updated_at),
      db.prepare('INSERT INTO collection_state (event_id,revision) VALUES (?,1) ON CONFLICT(event_id) DO UPDATE SET revision=revision+1').bind(EVENT),
    ]);
    if(result[0].meta.changes!==1)return json({error:'作品状态已更新，请刷新后重试。'},409);
    return json({flower:record({...current,status,updated_at:updatedAt})});
  }
  return json({error:'找不到这个管理功能。'},404);
}
