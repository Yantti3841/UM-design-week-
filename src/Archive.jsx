import React,{useEffect,useMemo,useState} from 'react';
import { listFlowers,watchFlowers } from './collection';
import { renderFlower } from './flowerSvg';
import './archive.css';

function Artwork({flower,assets}){
  const source=useMemo(()=>assets?'data:image/svg+xml;charset=utf-8,'+encodeURIComponent(renderFlower(flower.config,assets)):undefined,[flower.config,assets]);
  return <article><a href={source} download={`UMDW-${flower.number}.svg`}><img src={source} alt={flower.name?`${flower.name}的花`:`花 ${flower.number}`} loading="lazy"/></a><div><span>{flower.name||'未署名的花'}</span><small>NO. {flower.number}</small></div></article>;
}
export default function Archive(){
  const [flowers,setFlowers]=useState([]),[assets,setAssets]=useState(null),[visible,setVisible]=useState(48),[error,setError]=useState(''),[exporting,setExporting]=useState(false);
  useEffect(()=>{
    let unsubscribe,stopped=false,loading=false,again=false;
    const merge=items=>{if(stopped)return;setFlowers(previous=>[...new Map([...previous,...items].map(flower=>[flower.id,flower])).values()].sort((a,b)=>b.sequence-a.sequence));setError('');};
    async function refresh(){
      if(loading){again=true;return;}loading=true;
      try{do{again=false;const items=await listFlowers();if(!stopped){setFlowers(items.reverse());setError('');}}while(again&&!stopped);}
      catch{if(!stopped)setError('暂时无法读取作品库，请刷新重试。');}finally{loading=false;}
    }
    unsubscribe=watchFlowers((items,meta)=>meta.reset?refresh():merge(items),state=>{if(!stopped&&state==='reconnecting')setError('正在重新连接作品库，请稍候。');});
    refresh();
    fetch('/assets/final1014/patterns.json').then(response=>{if(!response.ok)throw Error();return response.json();}).then(data=>{if(!stopped)setAssets(data);}).catch(()=>{if(!stopped)setError('暂时无法读取图案，请刷新重试。');});
    return()=>{stopped=true;unsubscribe?.();};
  },[]);
  async function exportAll(){
    setExporting(true);setError('');
    try{
      const response=await fetch('/api/archive.zip');if(!response.ok)throw Error('Export failed');
      const url=URL.createObjectURL(await response.blob());
      const link=document.createElement('a');link.href=url;link.download='UMDW-flowers.zip';link.click();setTimeout(()=>URL.revokeObjectURL(url),10000);
    }catch{setError('导出暂时未能完成，请重试。');}finally{setExporting(false);}
  }
  return <main className="archive-page"><header className="archive-header"><a href="/">UMDW 2026</a><nav><a href="/wall">返回花海</a><button onClick={exportAll} disabled={!assets||!flowers.length||exporting}>{exporting?'正在导出…':'导出全部作品 ZIP'}</button></nav></header><section className="archive-intro"><div><h1>設計之源・花海作品</h1><p>共 {flowers.length} 朵作品 · 已保存到云端，可导出全部作品。</p></div></section>{error&&<p role="alert">{error}</p>}<section className="archive-grid" aria-label="已收集的花">{assets&&flowers.slice(0,visible).map(flower=><Artwork key={flower.id} flower={flower} assets={assets}/>)}</section>{!error&&!flowers.length&&<p className="archive-empty">还没有作品。制作完成后，点击“让花上屏”试一试。</p>}{visible<flowers.length&&<button className="archive-more" onClick={()=>setVisible(count=>count+48)}>加载更多作品</button>}</main>;
}
