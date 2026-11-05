import React,{useEffect,useMemo,useRef,useState} from 'react';
import gsap from 'gsap';
import {useGSAP} from '@gsap/react';
import {defaultConfig,disciplines,approaches,experiences,roles,regions,affiliations,backgroundSchemes,stepKeys} from './generator';
import {renderFlower} from './flowerSvg';
import {invitationSVG} from './invitationSvg';
import {submitFlower} from './collection';
import {recordInvitationCreation} from './invitationStats';
import {generatorTitle,invitationTitle} from './shareTitles';
import {EXHIBITION_END} from './event';
import {cardThemes,natureCopy} from './natureCopy';
import './nature.css';
gsap.registerPlugin(useGSAP);

function Range({label,value,onChange}){
 const update=e=>{const box=e.currentTarget.getBoundingClientRect();onChange(Math.round(Math.max(0,Math.min(1,(e.clientX-box.left-14)/(box.width-28)))*100));};
 return <input className="nature-range" type="range" min="0" max="100" step="1" aria-label={label} value={value} onChange={e=>onChange(Number(e.target.value))} onPointerDown={e=>{if(e.button!==0)return;e.preventDefault();e.currentTarget.focus({preventScroll:true});e.currentTarget.setPointerCapture(e.pointerId);update(e);}} onPointerMove={e=>{if(e.currentTarget.hasPointerCapture(e.pointerId))update(e);}} onPointerUp={e=>{if(e.currentTarget.hasPointerCapture(e.pointerId)){update(e);e.currentTarget.releasePointerCapture(e.pointerId);}}}/>;
}
function pngFromSVG(svg){
 return new Promise((resolve,reject)=>{const url=URL.createObjectURL(new Blob([svg],{type:'image/svg+xml;charset=utf-8'})),image=new Image();
 image.onload=()=>{try{const canvas=document.createElement('canvas');canvas.width=1080;canvas.height=1680;canvas.getContext('2d').drawImage(image,0,0);canvas.toBlob(blob=>blob?resolve(blob):reject(Error('PNG unavailable')),'image/png');}catch(e){reject(e);}finally{URL.revokeObjectURL(url);}};
 image.onerror=()=>{URL.revokeObjectURL(url);reject(Error('Image unavailable'));};image.src=url;});
}
export default function Experience({assets,invitation=false}){
 const root=useRef(null),submission=useRef(null),current=useRef(null);
 const [lang,setLang]=useState('zh'),[screen,setScreen]=useState('privacy'),[q,setQ]=useState(0);
 const [config,setConfig]=useState(()=>({...defaultConfig,motion:'still',speed:1})),[answers,setAnswers]=useState([]);
 const [poster,setPoster]=useState(null),[file,setFile]=useState(null),[imageError,setImageError]=useState(false),[retry,setRetry]=useState(0),[sheet,setSheet]=useState(false);
 const [sendStatus,setSendStatus]=useState('idle'),[notice,setNotice]=useState(''),[closed,setClosed]=useState(Date.now()>=Date.parse(EXHIBITION_END));
 current.current=config;
 const t=natureCopy[lang],key=stepKeys[q],theme=config.paletteScheme==null?{color:'#e7e8eb',ink:'#1c2c26'}:cardThemes[config.paletteScheme];
 const coloured=screen==='result',surface=coloured?theme:{color:'#e7e8eb',ink:'#1c2c26'};
 const flower=useMemo(()=>renderFlower(config,assets,{answers:screen==='privacy'||screen==='intro'?['peach']:answers}),[config,assets,answers,screen]);
 useEffect(()=>{document.title=invitation?invitationTitle:generatorTitle;document.documentElement.lang=lang==='zh'?'zh-Hant':'en';document.body.classList.add('nature-mode');return()=>document.body.classList.remove('nature-mode');},[lang,invitation]);
 useEffect(()=>{const resize=()=>{root.current?.style.setProperty('--nature-height',`${visualViewport?.height||innerHeight}px`);root.current?.style.setProperty('--nature-top',`${visualViewport?.offsetTop||0}px`);};resize();visualViewport?.addEventListener('resize',resize);visualViewport?.addEventListener('scroll',resize);addEventListener('resize',resize);return()=>{visualViewport?.removeEventListener('resize',resize);visualViewport?.removeEventListener('scroll',resize);removeEventListener('resize',resize);};},[]);
 useEffect(()=>{const delay=Date.parse(EXHIBITION_END)-Date.now();if(delay<=0){setClosed(true);return;}const timer=setTimeout(()=>setClosed(true),delay);return()=>clearTimeout(timer);},[]);
 useGSAP(()=>{const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;gsap.fromTo('.nature-scene-text',{opacity:0,y:reduced?0:screen==='intro'?28:9},{opacity:1,y:0,duration:reduced?0:screen==='intro'?1.2:.65,delay:reduced?0:.08,ease:'power2.out'});},{scope:root,dependencies:[screen,q,lang],revertOnUpdate:true});
 useEffect(()=>{
  if(screen!=='result'||!invitation)return;let active=true,url;setPoster(null);setFile(null);setImageError(false);
  pngFromSVG(invitationSVG(config,assets,lang)).then(blob=>{if(!active)return;url=URL.createObjectURL(blob);setPoster(url);setFile(new File([blob],'UMDW-Invitation-Card.png',{type:'image/png'}));recordInvitationCreation(config).catch(()=>{});}).catch(()=>{if(active)setImageError(true);});
  return()=>{active=false;if(url)URL.revokeObjectURL(url);};
 },[screen,config,assets,lang,retry,invitation]);
 function choose(field,value){
  const changes=field==='experienceLevel'?{experience:value<20?'new':value<100?'mid':'senior'}:field==='affiliationLevel'?{affiliation:value<50?'academia':'industry'}:field==='approach'&&!answers.includes('paletteScheme')?{palette:value==='specialist'?0:1}:field==='paletteScheme'?{palette:backgroundSchemes[value].palette}:{};
  setConfig(c=>({...c,[field]:value,...changes,page:null}));const answer=field==='experienceLevel'?'experience':field==='affiliationLevel'?'affiliation':field;if(stepKeys.includes(answer))setAnswers(a=>a.includes(answer)?a:[...a,answer]);setSendStatus('idle');setNotice('');
 }
 function home(){setScreen('intro');setQ(0);setAnswers([]);setConfig({...defaultConfig,motion:'still',speed:1});setNotice('');setSendStatus('idle');setSheet(false);}
 async function send(){
  if(invitation||sendStatus==='sending'||sendStatus==='sent'||closed)return;const fingerprint=JSON.stringify(config);if(submission.current?.fingerprint!==fingerprint)submission.current={fingerprint,id:crypto.randomUUID()};setSendStatus('sending');setNotice('');
  try{await submitFlower(config,submission.current.id);if(JSON.stringify(current.current)!==fingerprint)return;setSendStatus('sent');setNotice(t.sentNotice);}catch{if(JSON.stringify(current.current)===fingerprint){setSendStatus('error');setNotice(t.sendError);}}
 }
 function save(){if(!poster)return;const a=document.createElement('a');a.href=poster;a.download='UMDW-Invitation-Card.png';a.click();setSheet(true);}
 async function share(){if(file&&navigator.canShare?.({files:[file]})){try{await navigator.share({files:[file],title:t.title});return;}catch(e){if(e.name==='AbortError')return;}}setSheet(true);}
 const options={discipline:disciplines,approach:approaches,role:roles.filter(role=>role.id!=='none'),region:regions};
 const back=()=>{if(q===0)setScreen('intro');else setQ(q-1);};
 const next=()=>{if(q===6)setScreen('name');else setQ(q+1);};
 const illustration=<div className="nature-flower" role="img" aria-label={lang==='zh'?'您的花':'Your flower'} dangerouslySetInnerHTML={{__html:flower}}/>;
 return <main ref={root} className={`nature-experience scene-${screen}`} style={{'--nature-surface':surface.color,'--nature-ink':surface.ink}}>
  <div className="nature-language" aria-label="Language"><button aria-pressed={lang==='zh'} onClick={()=>setLang('zh')}>中文</button><button aria-pressed={lang==='en'} onClick={()=>setLang('en')}>EN</button></div>
  {closed?<section className="nature-privacy"><h1>{t.closed}</h1><p>{t.closedHint}</p></section>:<>
  {screen==='privacy'&&<section className="nature-privacy nature-scene-text"><h1>{t.privacyTitle}</h1><p>{t.privacy}</p><div className="nature-consent-actions"><button className="nature-primary" onClick={()=>setScreen('intro')}>{t.understand}</button><button onClick={()=>setScreen('declined')}>{t.decline}</button></div></section>}
  {screen==='declined'&&<section className="nature-privacy nature-scene-text"><h1>{t.declinedTitle}</h1><p>{t.declinedHint}</p><button className="nature-primary" onClick={()=>setScreen('privacy')}>{t.reviewConsent}</button></section>}
  {screen==='intro'&&<section className="nature-intro"><div className="nature-poster-art" aria-hidden="true"><div className="nature-orbit-scene" aria-hidden="true"><div className="ambient-orbit ambient-large"><img src="/assets/wall/wall-rings-1104.png" alt=""/></div><div className="ambient-orbit ambient-green"><img src="/assets/wall/orbit-small-1-1104.png" alt=""/></div><div className="ambient-orbit ambient-pink"><img src="/assets/wall/orbit-small-0-1104.png" alt=""/></div><div className="ambient-orbit ambient-blue"><img src="/assets/wall/orbit-small-2-1104.png" alt=""/></div></div></div><div className="nature-intro-copy nature-scene-text"><h1>{invitation?t.title:t.generatorTitle}</h1><p className="nature-subtitle">{invitation?t.subtitle:t.generatorSubtitle}</p><p className="nature-story">{(invitation?t.story:t.generatorStory).join(lang==='zh'?'':' ')}</p><button className="nature-start nature-primary" onClick={()=>{setQ(0);setScreen('question');}}>{invitation?t.start:t.generatorStart}</button></div></section>}
  {screen==='question'&&<section className="nature-question"><div className="nature-counter">{t.question} <span>{String(q+1).padStart(2,'0')} / 07</span></div><div className="nature-visual">{illustration}</div><div className="nature-question-controls"><h1 className="nature-scene-text" key={q}>{t.questions[q]}</h1>
   {options[key]&&<div className={`nature-choices nature-choices-${key}`} role="group" aria-label={t.questions[q]}>{options[key].map(option=><button key={option.id} aria-pressed={answers.includes(key)&&config[key]===option.id} onClick={()=>choose(key,option.id)}>{option[`${lang}Short`]||option[lang]}</button>)}</div>}
   {key==='experience'&&<div className="nature-range-area"><Range label={t.questions[q]} value={config.experienceLevel??0} onChange={v=>choose('experienceLevel',v)}/><div className="nature-endpoints">{[0,50,100].map((value,i)=><button key={value} onClick={()=>choose('experienceLevel',value)}>{[t.year0,t.year5,t.year10][i]}</button>)}</div></div>}
   {key==='affiliation'&&<div className="nature-range-area"><Range label={t.questions[q]} value={config.affiliationLevel??0} onChange={v=>choose('affiliationLevel',v)}/><div className="nature-endpoints"><button onClick={()=>choose('affiliationLevel',0)}>{t.academic}</button><button onClick={()=>choose('affiliationLevel',100)}>{t.industry}</button></div></div>}
   {key==='paletteScheme'&&<div className="nature-palettes" role="group" aria-label={t.questions[q]}>{cardThemes.map((item,i)=><button key={i} aria-label={item[lang]} aria-pressed={config.paletteScheme===i} onClick={()=>choose('paletteScheme',i)}><i style={{background:item.color}}/><span>{item[lang]}</span></button>)}</div>}
  </div><nav className="nature-navigation"><button onClick={back}>{t.back}</button><button onClick={home}>{t.home}</button><button className="nature-primary" disabled={!answers.includes(key)} onClick={next}>{t.next}</button></nav></section>}
  {screen==='name'&&<section className="nature-name"><div className="nature-counter">{t.nameStep}</div><div className="nature-visual">{illustration}</div><div className="nature-name-field nature-scene-text"><h1><label htmlFor="nature-name">{t.nameTitle}</label></h1><input id="nature-name" maxLength={20} value={config.name} placeholder={t.namePlaceholder} autoComplete="off" onChange={e=>choose('name',e.target.value)} onKeyDown={e=>{if(e.key==='Enter'){e.currentTarget.blur();setScreen('result');}}}/><p>{t.nameHint}</p></div><nav className="nature-navigation"><button onClick={()=>{setQ(6);setScreen('question');}}>{t.back}</button><button onClick={home}>{t.home}</button><button className="nature-primary" onClick={()=>setScreen('result')}>{invitation?t.makeCard:t.makeFlower}</button></nav></section>}
  {screen==='result'&&invitation&&<section className="nature-result"><div className="nature-card-preview">{poster?<img src={poster} alt={t.card}/>:<p role="status">{imageError?t.imageError:t.preparing}</p>}</div><div className="nature-card-actions"><h1>{t.card}</h1><p className="nature-save-reminder">{t.saveHint}</p>{imageError&&<button onClick={()=>setRetry(n=>n+1)}>{t.retry}</button>}<div className="nature-save-actions"><button className="nature-primary" disabled={!poster} onClick={save}>{t.save}</button><button disabled={!poster} onClick={share}>{t.share}</button></div><button className="nature-edit" disabled={sendStatus==='sending'} onClick={()=>{setScreen('name');setSheet(false);}}>{t.edit}</button><p role="status">{notice}</p></div></section>}
  {screen==='result'&&!invitation&&<section className="nature-result nature-generator-result"><div className="nature-generator-preview">{illustration}</div><div className="nature-card-actions nature-generator-actions"><h1>{t.flowerReady}</h1>{config.name&&<p>{config.name}</p>}<button className="nature-upload-large" disabled={sendStatus==='sending'||sendStatus==='sent'} onClick={send}>{sendStatus==='sending'?t.sending:sendStatus==='sent'?t.sent:t.send}</button><button className="nature-edit" disabled={sendStatus==='sending'} onClick={()=>setScreen('name')}>{t.edit}</button><p role="status">{notice}</p></div></section>}
  </>}
  {sheet&&poster&&<div className="nature-save-sheet" role="dialog" aria-modal="true" aria-label={t.save}><button autoFocus onClick={()=>setSheet(false)}>{t.close}</button><p>{t.saveHint}</p><img src={poster} alt={t.card}/></div>}
 </main>;
}
