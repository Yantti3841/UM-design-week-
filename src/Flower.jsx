import React, { useEffect, useMemo, useRef } from 'react';
import { derive, interpolatePattern, patternMarkup } from './generator';
function Pattern({assets,layer}) {
  const {pattern,key,color,part,colors,progress}=layer;
  const markup=useMemo(()=>patternMarkup(progress==null?assets[pattern-1]:interpolatePattern(assets,key,progress),key,color,part,colors),[assets,pattern,key,color,part,colors,progress]);
  return <svg width="700" height="700" viewBox="0 0 700 700" preserveAspectRatio="xMidYMid meet" dangerouslySetInnerHTML={{__html:markup}}/>;
}
export default function Flower({config,assets,label,answers}) {
  const ref=useRef(null);
  const elapsedRef=useRef(0);
  const layers=derive(config).filter(layer=>layer.key==='peach'||answers.includes(layer.key)||(layer.key.startsWith('region-')&&answers.includes('region')));
  const layerId=layer=>`${layer.key}-${layer.progress==null?layer.pattern:'continuous'}-${layer.part}`;
  const signature=layers.map(layerId).join(',');
  useEffect(()=>{
    const groups=[...ref.current.querySelectorAll('[data-animated]')];
    if(!groups.length)return;
    if(config.motion==='still'){groups.forEach(g=>g.removeAttribute('transform'));return;}
    let frame;
    let previous=performance.now();
    function tick(now){
      if(!document.hidden)elapsedRef.current+=Math.min(now-previous,100)/1000*config.speed;
      previous=now;
      const elapsed=elapsedRef.current;
      groups.forEach(g=>{
        const index=['experience','role','region-nodes','affiliation'].indexOf(g.dataset.animated);
        const wave=elapsed*Math.PI*2/7+index*0.65;
        const angle=config.motion==='rotate'?elapsed*3.6*[0.75,0.55,-0.35,-0.2][index]+Math.sin(wave)*0.8:Math.sin(wave)*1.2;
        const scale=1+Math.sin(wave)*(config.motion==='rotate'?0.006:0.018);
        g.setAttribute('transform',`translate(350 350) rotate(${angle}) scale(${scale}) translate(-350 -350)`);
      });
      frame=requestAnimationFrame(tick);
    }
    frame=requestAnimationFrame(tick);
    return()=>cancelAnimationFrame(frame);
  },[config.motion,config.speed,signature]);
  return <svg ref={ref} id="flower-canvas" className="flower-svg" viewBox="-10 -10 720 720" preserveAspectRatio="xMidYMid meet" role="img" aria-label={label}>
    {layers.filter(layer=>layer.pattern).map(layer=><g className="layer-entry" key={layerId(layer)} data-layer={layer.key} data-pattern={layer.pattern} data-part={layer.part} data-progress={layer.progress}><g data-animated={layer.animated?layer.key:undefined}><Pattern assets={assets} layer={layer}/></g></g>)}
  </svg>;
}
