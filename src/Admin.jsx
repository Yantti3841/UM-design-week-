import React,{useEffect,useRef,useState} from 'react';
import FlowerImage from './FlowerImage';
import './admin.css';

const labels={all:'全部作品',active:'正在上屏',hidden:'已撤下',trash:'回收站'};
const actions={hide:'从大屏撤下',show:'重新上屏',trash:'移入回收站',restore:'恢复作品'};
const login='/signin-with-chatgpt?return_to=%2Fadmin',logout='/signout-with-chatgpt?return_to=%2Fadmin';
async function api(path,options={}){
  const response=await fetch(path,{cache:'no-store',...options});
  const result=await response.json();
  if(!response.ok)throw Object.assign(Error(result.error||'暂时无法连接，请重试。'),{status:response.status});
  return result;
}
function TrashDialog({flower,assets,onCancel,onConfirm,busy,error}){
  const dialog=useRef(null);
  useEffect(()=>{dialog.current.showModal();},[]);
  return <dialog ref={dialog} className="admin-dialog" aria-labelledby="trash-title" onCancel={event=>{event.preventDefault();if(!busy)onCancel();}}>
    <FlowerImage flower={flower} assets={assets}/><h2 id="trash-title">移入回收站？</h2><p>「{flower.name||`花 ${flower.number}`}」将从大屏和公开作品库移除。原始文件会保留，可以随时恢复。</p>
    {error&&<p role="alert">{error}</p>}<div><button autoFocus disabled={busy} onClick={onCancel}>取消</button><button className="admin-danger" disabled={busy} onClick={onConfirm}>{busy?'处理中…':'确认移入回收站'}</button></div>
  </dialog>;
}
export default function Admin(){
  const [session,setSession]=useState(null),[gate,setGate]=useState({loading:true,status:0,message:''}),[assets,setAssets]=useState(null);
  const [status,setStatus]=useState('all'),[draft,setDraft]=useState(''),[query,setQuery]=useState(''),[items,setItems]=useState([]),[counts,setCounts]=useState({all:0,active:0,hidden:0,trash:0});
  const [cursor,setCursor]=useState(null),[loading,setLoading]=useState(false),[busy,setBusy]=useState(''),[error,setError]=useState(''),[notice,setNotice]=useState(''),[trash,setTrash]=useState(null),[refresh,setRefresh]=useState(0);
  const requestId=useRef(0);
  useEffect(()=>{
    const controller=new AbortController();
    api('/api/admin/session',{signal:controller.signal}).then(result=>{setSession(result.admin);setGate({loading:false,status:200,message:''});}).catch(error=>{if(error.name!=='AbortError')setGate({loading:false,status:error.status,message:error.message});});
    return()=>controller.abort();
  },[]);
  useEffect(()=>{
    if(!session)return;const controller=new AbortController();
    fetch('/assets/final1014/patterns.json',{signal:controller.signal}).then(r=>{if(!r.ok)throw Error('图案加载失败，请刷新重试。');return r.json();}).then(setAssets).catch(error=>{if(error.name!=='AbortError')setError(error.message);});
    return()=>controller.abort();
  },[session]);
  async function load(append=false,signal){
    const id=++requestId.current;setLoading(true);setError('');
    const params=new URLSearchParams({status,q:query,...(append&&cursor?{before:String(cursor)}:{})});
    try{
      const data=await api('/api/admin/flowers?'+params,{signal});if(id!==requestId.current)return;
      setItems(previous=>append?[...previous,...data.flowers.filter(item=>!previous.some(p=>p.id===item.id))]:data.flowers);setCounts(data.counts);setCursor(data.nextCursor);
    }catch(error){if(error.name!=='AbortError'&&id===requestId.current){setError(error.message);if(error.status===401||error.status===403){setSession(null);setGate({loading:false,status:error.status,message:error.message});}}}
    finally{if(id===requestId.current)setLoading(false);}
  }
  useEffect(()=>{if(!session)return;const controller=new AbortController();load(false,controller.signal);return()=>controller.abort();},[session,status,query,refresh]);
  useEffect(()=>{
    const next=draft.trim();if(!session||busy||next===query)return;
    const timer=setTimeout(()=>{setStatus('all');setQuery(next);setNotice('');},350);
    return()=>clearTimeout(timer);
  },[draft,query,session,busy]);
  async function act(flower,action){
    if(busy)return;setBusy(flower.id);setError('');setNotice('');
    try{
      const {flower:updated}=await api('/api/admin/flowers/'+flower.id,{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({action,status:flower.status,updatedAt:flower.updatedAt})});
      setItems(previous=>previous.map(item=>item.id===updated.id?updated:item).filter(item=>status==='all'||item.status===status));
      setCounts(previous=>({...previous,[flower.status]:previous[flower.status]-1,[updated.status]:previous[updated.status]+1}));setTrash(null);
      setNotice(action==='restore'&&updated.status==='hidden'?'已恢复到“已撤下”，需要时可重新上屏。':`${actions[action]}成功，大屏会自动同步。`);
    }catch(error){setError(error.message);if(error.status===409){setTrash(null);setRefresh(value=>value+1);}if(error.status===401||error.status===403){setTrash(null);setSession(null);setGate({loading:false,status:error.status,message:error.message});}}
    finally{setBusy('');}
  }
  return <main className="admin-page"><header className="admin-header"><a className="admin-brand" href="/admin">UMDW <span>2026</span><small>設計之源 · 管理平台</small></a><nav aria-label="管理导航"><a href="/wall" target="_blank" rel="noopener">打开大屏</a>{session&&<><a href="/archive" target="_blank" rel="noopener">公开作品库</a><a href={logout}>退出登录</a></>}</nav></header>
    {!session?<section className="admin-gate"><span className="admin-eyebrow">THE NATURE OF DESIGN · ADMIN</span><h1>管理你的花海</h1><p>{gate.loading?'正在检查登录状态…':gate.message||'登录后管理作品和大屏。'}</p>{!gate.loading&&<><a className="admin-primary" href={gate.status===403?logout:login} target="_top">{gate.status===403?'切换管理员账号':'使用 ChatGPT 登录'}</a><p className="admin-small">仅已授权的管理员可以进入。扫码制作花无需登录。</p></>}</section>:<>
      <section className="admin-intro"><div><span className="admin-eyebrow">THE NATURE OF DESIGN · COLLECTION</span><h1>花海管理</h1><p>展陳收集至 2026.11.17，結束後統一清理資料。</p></div><div className="admin-account"><span>{session.email}</span><a className="admin-primary" href="/api/admin/archive.zip">导出全部作品 ZIP</a><small>包含回收站中的 SVG 与配置</small></div></section>
      <div className="admin-stats" aria-label="作品状态">{Object.entries(labels).map(([key,label])=><button key={key} disabled={!!busy} aria-pressed={status===key} onClick={()=>{setStatus(key);setNotice('');}}><span>{label}</span><strong>{counts[key]}</strong><small>{key==='active'?'最近 60 朵在大屏漂浮':key==='hidden'?'保留作品，暂不上屏':key==='trash'?'可恢复，不会永久删除':'所有已收集的花'}</small></button>)}</div>
      <section className="admin-toolbar"><form role="search" onSubmit={event=>{event.preventDefault();setStatus('all');setQuery(draft.trim());setNotice('');setRefresh(value=>value+1);}}><label htmlFor="admin-search">搜索作品</label><input id="admin-search" value={draft} maxLength={80} onChange={event=>setDraft(event.target.value)} placeholder="输入署名或编号，自动搜索全部作品" disabled={!!busy}/><button type="submit" disabled={!!busy}>搜索</button>{query&&<button type="button" onClick={()=>{setDraft('');setQuery('');}}>清除</button>}</form><button className="admin-refresh" disabled={loading||!!busy} onClick={()=>setRefresh(value=>value+1)}>{loading?'正在读取…':'刷新列表'}</button></section>
      <div className="admin-feedback" aria-live="polite">{error?<p role="alert" className="admin-error">{error}</p>:notice?<p>{notice}</p>:<p>{query?`搜索“${query}” · 范围：${labels[status]}`:'撤下只影响大屏；移入回收站也会从公开作品库隐藏。'}</p>}</div>
      <section className="admin-grid" aria-label={labels[status]} aria-busy={loading}>{items.map(flower=><article key={flower.id} data-flower-id={flower.id} data-status={flower.status}>
        <div className="admin-art"><span className={'admin-badge '+flower.status}>{labels[flower.status]}</span><FlowerImage flower={flower} assets={assets}/></div>
        <div className="admin-card-content"><div className="admin-card-title"><h2>{flower.name||'未署名的花'}</h2><span>#{flower.number}</span></div><time dateTime={flower.createdAt}>{new Date(flower.createdAt).toLocaleString('zh-CN',{month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hour12:false})} 上传</time>
        <div className="admin-card-actions">{flower.status==='trash'?<button disabled={!!busy||loading} onClick={()=>act(flower,'restore')}>{busy===flower.id?'处理中…':'恢复作品'}</button>:<><button disabled={!!busy||loading} onClick={()=>act(flower,flower.status==='active'?'hide':'show')}>{busy===flower.id?'处理中…':flower.status==='active'?'从大屏撤下':'重新上屏'}</button><button className="admin-trash-button" disabled={!!busy||loading} onClick={()=>setTrash(flower)}>移入回收站</button></>}</div></div>
      </article>)}</section>
      {!loading&&!items.length&&<section className="admin-empty"><h2>{query?'没有找到匹配的花':status==='trash'?'回收站是空的':'这里暂时没有花'}</h2><p>{query?`当前范围：${labels[status]}。可以更换署名或编号。`:status==='trash'?'移入回收站的作品会保留在这里，随时可以恢复。':'手机制作完成并上传后，就会出现在这里。'}</p>{query&&status!=='all'&&<button className="admin-primary" onClick={()=>setStatus('all')}>在全部作品中搜索</button>}</section>}
      {cursor&&<button className="admin-more" disabled={loading||!!busy} onClick={()=>load(true)}>{loading?'正在读取…':'加载更多作品'}</button>}
      {trash&&<TrashDialog flower={trash} assets={assets} busy={!!busy} error={error} onCancel={()=>setTrash(null)} onConfirm={()=>act(trash,'trash')}/>}
    </>}
  </main>;
}
