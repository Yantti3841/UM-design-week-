import React,{useEffect,useMemo,useState} from 'react';
import { defaultConfig,presets } from './generator';
import { renderFlower } from './flowerSvg';
import { invitationSVG,invitationQR,invitationURL } from './invitationSvg';
import './invitation.css';

const copy={
  zh:{title:'花開，邀你同來。',subtitle:'桃花源 · 環澳琴 澳門大學設計周',intro:'每個人，都是一朵花。',body:'桃花源，是不同經歷與設計角色相遇的地方。我們以桃花為共同的語言，讓領域、資歷與身份化作圖形，一層層疊加，綻放成獨一無二的你。',invitation:'邀你用自己的故事，種下一朵桃花，也把這份邀請帶給下一位同行者。',start:'製作我的桃花邀請函',time:'約 1 分鐘 · 無需登入',result:'這份邀請，因你而不同。',save:'保存邀請函',share:'分享邀請函',edit:'返回修改',hint:'保存圖片後，可發送給朋友或分享到朋友圈。',longpress:'長按下方圖片，選擇「儲存圖片」，再到微信分享。',close:'收起圖片',error:'圖片生成失敗，請重試。',preparing:'正在生成高清邀請函…',qr:'轉發這個二維碼，邀請更多人製作桃花',qrDownload:'保存入口二維碼',back:'閱讀策展理念'},
  en:{title:'A blossom. An invitation.',subtitle:'Peach Blossom Spring · UM Design Week',intro:'Everyone is a blossom.',body:'Peach Blossom Spring brings different experiences and design roles together. A shared floral language turns your field, experience and identity into shapes, layer by layer, to create a blossom that is uniquely yours.',invitation:'Grow a blossom from your story, and pass the invitation to someone new.',start:'Create my blossom invitation',time:'About 1 minute · No sign-in',result:'An invitation, made yours.',save:'Save invitation',share:'Share invitation',edit:'Back to edit',hint:'Save the image to share with friends or post to WeChat Moments.',longpress:'Touch and hold the image below to save it, then share it in WeChat.',close:'Close image',error:'Could not create the image. Please try again.',preparing:'Preparing your high-resolution invitation…',qr:'Forward this QR code to invite someone to create',qrDownload:'Save entry QR code',back:'Read the curatorial idea'},
};
function imageBlob(svg,width=1080,height=1620){
  return new Promise((resolve,reject)=>{
    const url=URL.createObjectURL(new Blob([svg],{type:'image/svg+xml;charset=utf-8'})),image=new Image();
    image.onload=()=>{try{const canvas=document.createElement('canvas');canvas.width=width;canvas.height=height;canvas.getContext('2d').drawImage(image,0,0);canvas.toBlob(blob=>blob?resolve(blob):reject(Error('PNG unavailable')),'image/png');}catch(error){reject(error);}finally{URL.revokeObjectURL(url);}};
    image.onerror=()=>{URL.revokeObjectURL(url);reject(Error('Image unavailable'));};image.src=url;
  });
}
function download(url,name){const link=document.createElement('a');link.href=url;link.download=name;link.click();}
export default function Invitation({assets,Creator}){
  const [lang,setLang]=useState('zh'),[started,setStarted]=useState(false),[page,setPage]=useState('intro');
  const [recipe,setRecipe]=useState(null),[poster,setPoster]=useState(null),[file,setFile]=useState(null),[error,setError]=useState(''),[sheet,setSheet]=useState(false),[qrOpen,setQrOpen]=useState(false),[retry,setRetry]=useState(0);
  const t=copy[lang];
  const hero=useMemo(()=>renderFlower({...defaultConfig,...presets[0],motion:'still'},assets,{projection:true}),[assets]);
  const qr=useMemo(()=>invitationQR(),[]);
  useEffect(()=>{document.body.classList.add('invitation-mode');document.title='桃花源 · Your Blossom Invitation';return()=>document.body.classList.remove('invitation-mode');},[]);
  useEffect(()=>{document.documentElement.lang=lang==='zh'?'zh-Hant':'en';},[lang]);
  useEffect(()=>{
    if(!recipe)return;
    let active=true,url;setPoster(null);setFile(null);setError('');
    (async()=>{
      const png=await imageBlob(invitationSVG(recipe,assets,lang));
      if(!active)return;url=URL.createObjectURL(png);setPoster(url);setFile(new File([png],'UMDW-Invitation.png',{type:'image/png'}));
    })().catch(()=>{if(active)setError(copy[lang].error);});
    return()=>{active=false;if(url)URL.revokeObjectURL(url);};
  },[recipe,lang,assets,retry]);
  function language(value){setLang(value);setSheet(false);}
  async function share(){
    if(file&&navigator.canShare?.({files:[file]})){
      try{await navigator.share({files:[file],title:lang==='zh'?'桃花源邀請函':'A blossom invitation'});return;}catch(error){if(error.name==='AbortError')return;}
    }
    setSheet(true);
  }
  const chrome=<header className="invite-header"><span>UMDW 2026</span><span className="invite-page-title">{lang==='zh'?'桃花邀請函':'Blossom invitation'}</span><div className="language-switch"><button aria-pressed={lang==='zh'} onClick={()=>language('zh')}>中文</button><button aria-pressed={lang==='en'} onClick={()=>language('en')}>EN</button></div></header>;
  return <>
    <div hidden={page!=='intro'} className="invite-shell">{chrome}<main className="invite-intro">
      <div className="invite-hero" dangerouslySetInnerHTML={{__html:hero}}/>
      <div className="invite-story"><p className="invite-subtitle">{t.subtitle}</p><h1>{t.title}</h1><h2>{t.intro}</h2><p>{t.body}</p><p>{t.invitation}</p><p className="invite-dates">26 October – 17 November 2026</p>
      <button className="invite-primary" onClick={()=>{setStarted(true);setPage('create');}}>{t.start}</button><small>{t.time}</small>
      <button className="invite-text" aria-expanded={qrOpen} onClick={()=>setQrOpen(!qrOpen)}>{t.qr}</button>{qrOpen&&<div className="invite-entry-qr"><div dangerouslySetInnerHTML={{__html:qr}}/><a href={invitationURL}>{invitationURL}</a><button onClick={async()=>{try{const url=URL.createObjectURL(await imageBlob(qr,1024,1024));download(url,'UMDW-Invitation-QR.png');setTimeout(()=>URL.revokeObjectURL(url),10000);}catch{setError(t.error);}}}>{t.qrDownload}</button></div>}</div>
    </main></div>
    {started&&<div hidden={page!=='create'} className="invite-creator"><Creator assets={assets} initialLang={lang} onIntroduction={()=>setPage('intro')} onInvitation={(config,selectedLang)=>{setLang(selectedLang);setRecipe({...config});setSheet(false);setPage('result');window.scrollTo(0,0);}}/></div>}
    {page==='result'&&<div className="invite-shell invite-result-shell">{chrome}<main className="invite-result"><div className="invite-poster">{poster?<img src={poster} alt={lang==='zh'?'你的個人桃花邀請函':'Your personal blossom invitation'}/>:<p role="status">{error||t.preparing}</p>}</div><div className="invite-result-actions"><h1>{t.result}</h1><p>{t.hint}</p>{error&&<button onClick={()=>setRetry(n=>n+1)}>{lang==='zh'?'重新生成':'Try again'}</button>}<button className="invite-primary" disabled={!poster} onClick={()=>{download(poster,'UMDW-Invitation.png');setSheet(true);}}>{t.save}</button><button className="invite-secondary" disabled={!poster} onClick={share}>{t.share}</button><button className="invite-text" onClick={()=>{setSheet(false);setPage('create');}}>{t.edit}</button></div></main></div>}
    {sheet&&poster&&<div className="invite-save-sheet" role="dialog" aria-modal="true" aria-label={t.save}><button autoFocus onClick={()=>setSheet(false)}>{t.close}</button><p>{t.longpress}</p><img src={poster} alt={t.save}/></div>}
  </>;
}
