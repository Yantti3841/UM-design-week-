import React, { useEffect, useRef } from 'react';
import { disciplines, affiliations, experiences, roles, regions, approaches, palettes, backgroundSchemes, presets, stepKeys } from './generator';
export function Thumbnail({id}) {return <img src={`/assets/final1014/pattern-${String(id).padStart(2,'0')}.svg`} alt=""/>;}
function RangeInput({label,value,min,max,step=1,onChange}) {
  const update=e=>{
    const {left,width}=e.currentTarget.getBoundingClientRect();
    const progress=Math.max(0,Math.min(1,(e.clientX-left-13)/(width-26)));
    onChange(Number((min+Math.round(progress*(max-min)/step)*step).toFixed(2)));
  };
  return <input type="range" aria-label={label} min={min} max={max} step={step} value={value} onChange={e=>onChange(Number(e.target.value))} onPointerDown={e=>{if(e.button!==0)return;e.preventDefault();e.currentTarget.focus({preventScroll:true});e.currentTarget.setPointerCapture(e.pointerId);update(e);}} onPointerMove={e=>{if(e.currentTarget.hasPointerCapture(e.pointerId))update(e);}} onPointerUp={e=>{if(e.currentTarget.hasPointerCapture(e.pointerId)){update(e);e.currentTarget.releasePointerCapture(e.pointerId);}}} onKeyDown={e=>{if(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Home','End','PageUp','PageDown'].includes(e.key))onChange(value);}}/>;
}
function GraphicChoices({label,options,value,lang,onChange,note}) {
  const patterns=options.filter(o=>o.pattern);
  const empty=options.find(o=>!o.pattern);
  return <div className={`graphic-choices${note?' region-choices':''}`} role="group" aria-label={label}><span className="field-label">{label}</span><div className="graphic-options" style={{'--option-count':patterns.length}}>{patterns.map((o,i)=><button key={o.id} data-pattern={o.pattern} style={{'--choice-index':i}} title={o[lang]} aria-label={o[lang]} aria-pressed={o.id===value} onClick={()=>onChange(o.id)}><img src={`/assets/final1014/thumbnail-${String(o.pattern).padStart(2,'0')}.svg`} alt=""/><span>{o[`${lang}Short`]||o[lang]}</span></button>)}</div>{empty&&<button className="clear-layer" aria-pressed={empty.id===value} onClick={()=>onChange(empty.id)}>{empty[lang]}</button>}{note&&<p className="source-note">{note}</p>}</div>;
}
export default function Controls({config,lang,t,step,answers,onChange,onPreset,onScheme,onBack,onNext,reset,onSend,sendStatus}) {
  const card=useRef(null);
  const complete=step===stepKeys.length;
  const key=stepKeys[step];
  const options=[disciplines,approaches,experiences,roles,regions,affiliations];
  const questions=[t.field,t.approach,t.experience,t.role,t.region,t.affiliation];
  const continuousKey=key==='experience'?'experienceLevel':'affiliationLevel';
  const sliderValue=key==='experience'?(config.experienceLevel??{new:0,mid:50,senior:100}[config.experience]):(config.affiliationLevel??(config.affiliation==='academia'?0:100));
  useEffect(()=>{card.current.focus({preventScroll:true});},[step]);
  return <aside className="identity-panel wizard-panel"><h1>{t.title}</h1><p className="intro">{t.hint}</p>
    <div className="step-progress" aria-label={t.progress}>{stepKeys.map((k,i)=><i key={k} className={i===step&&!complete?'current':answers.includes(k)?'answered':''}/>)}</div>
    <section key={step} ref={card} tabIndex={-1} className="step-card" data-step={step} data-parameter={key||'complete'}>
      <div className="step-counter">{complete?t.finished:`${t.step} ${String(step+1).padStart(2,'0')} / 07`}</div>
      {step<6&&<GraphicChoices label={questions[step]} options={options[step]} value={answers.includes(key)?config[key]:null} lang={lang} note={key==='region'?t.chinaScope:undefined} onChange={v=>onChange(key,v)}/>}
      {(key==='experience'||key==='affiliation')&&<div className="morph-control"><label className="slider"><span>{key==='experience'?t.seniority:t.connection}</span><RangeInput label={key==='experience'?t.seniority:t.connection} min={0} max={100} value={sliderValue} onChange={v=>onChange(continuousKey,v)}/></label><div className="morph-endpoints"><span>{key==='experience'?t.newcomer:t.academia}</span><span>{key==='experience'?t.expert:t.industry}</span></div></div>}
      {step===6&&<div className="compact-schemes" role="group" aria-label={t.schemes}><span className="field-label">{t.schemes}</span>{backgroundSchemes.map((s,i)=><button key={s.page} style={{'--choice-index':i}} aria-label={s[lang]} aria-pressed={config.paletteScheme===i} onClick={()=>onScheme(i)}><span className="scheme-colors" aria-hidden="true">{[...s.colors,palettes[s.palette].color].map((color,j)=><i key={j} style={{background:color}}/>)}</span><span>{s[lang]}</span><span className="selection-mark" aria-hidden="true">{config.paletteScheme===i?'✓':''}</span></button>)}<p className="source-note">{t.schemeHint}</p></div>}
      {complete&&<><h2 className="completion-title">{t.completeTitle}</h2><p className="source-note">{t.completeHint}</p><label className="name-label" htmlFor="name">{t.name}<small>{t.optional}</small></label><input id="name" maxLength={20} value={config.name} placeholder={t.placeholder} onChange={e=>onChange('name',e.target.value)}/><div className="field-label">{t.motion}</div><div className="motion-options">{['still','rotate','breathe'].map(m=><button key={m} aria-pressed={config.motion===m} onClick={()=>onChange('motion',m)}>{t[m]}</button>)}</div><label className="slider"><span>{t.speed}</span><RangeInput label={t.speed} min={0.5} max={2} step={0.1} value={config.speed} onChange={v=>onChange('speed',v)}/><output>{config.speed}×</output></label><details className="preset-library"><summary>{t.presets}<span>8</span></summary><div className="preset-content"><p>{t.presetHint}</p><div className="preset-options">{presets.map((p,i)=><button key={p.page} aria-label={`${t.sample} ${i+1}`} onClick={()=>onPreset(i)}><Thumbnail id={p.page}/><span>{String(i+1).padStart(2,'0')}</span></button>)}</div></div></details></>}
      {complete&&<button className="send-flower" disabled={sendStatus==='sending'||sendStatus==='sent'} onClick={onSend}>{sendStatus==='sending'?t.sending:sendStatus==='sent'?t.sent:t.send}</button>}
    </section>
    <div className="step-navigation" data-complete={complete}><button className="back-step" disabled={step===0||sendStatus==='sending'} onClick={onBack}>← {t.back}</button><button className="reset" onClick={reset} disabled={sendStatus==='sending'}>{t.reset}</button>{!complete&&<button className="next-step" disabled={!answers.includes(key)} onClick={onNext}>{step===6?t.finish:t.next} →</button>}</div>
  </aside>;
}
