import React,{useEffect,useMemo,useRef,useState} from 'react';
import qrcode from 'qrcode-generator';
import { watchFlowers } from './collection';
import { makeBody,advanceWorld } from './wallMotion';
import FlowerImage from './FlowerImage';
import { PUBLIC_EVENT_URL } from './event';
import './wall.css';
import {wallOrbits} from './wallOrbits';

const artwork={x:850,y:220,width:7500,contentHeight:3350};
const fixedStep=1/120;

function visibleEdges(image){
  const size=256,canvas=document.createElement('canvas');canvas.width=canvas.height=size;
  const context=canvas.getContext('2d');context.drawImage(image,0,0,size,size);
  const pixels=context.getImageData(0,0,size,size).data;
  let left=size,top=size,right=0,bottom=0;
  for(let y=0;y<size;y++)for(let x=0;x<size;x++)if(pixels[(y*size+x)*4+3]>8){left=Math.min(left,x);right=Math.max(right,x+1);top=Math.min(top,y);bottom=Math.max(bottom,y+1);}
  return {left:.5-left/size,right:right/size-.5,top:.5-top/size,bottom:bottom/size-.5};
}

function FlowerField({flowers,assets,layout}){
  const elements=useRef(new Map()),imageBounds=useRef(new Map()),world=useRef({bodies:[],width:0,height:0});
  useEffect(()=>{
    const previous=world.current,{width,height}=layout;
    const remaining=new Set(flowers.map(flower=>flower.id));
    for(const id of imageBounds.current.keys())if(!remaining.has(id))imageBounds.current.delete(id);
    const bodies=previous.bodies.filter(body=>remaining.has(body.id));
    if(previous.width&&previous.height)for(const body of bodies){body.x*=width/previous.width;body.y*=height/previous.height;}
    for(const flower of flowers){
      const existing=bodies.find(body=>body.id===flower.id);
      const shape=makeBody(flower.id,width,height,flowers.length,bodies);
      shape.edges=imageBounds.current.get(flower.id);
      if(existing){existing.size=shape.size;existing.radius=shape.radius;}
      else bodies.push(shape);
    }
    advanceWorld(bodies,1/120,width,height);
    for(const body of bodies){body.previousX=body.x;body.previousY=body.y;}
    world.current={bodies,width,height};
  },[flowers,layout]);
  useEffect(()=>{
    let frame,last=0,accumulator=0;
    const preference=matchMedia('(prefers-reduced-motion: reduce)');
    function draw(now){
      const {bodies,width,height}=world.current;
      const dt=last?Math.min((now-last)/1000,.05):0;last=now;
      accumulator+=preference.matches?dt*.65:dt;
      while(accumulator>=fixedStep){
        for(const body of bodies){body.previousX=body.x;body.previousY=body.y;}
        advanceWorld(bodies,fixedStep,width,height);accumulator-=fixedStep;
      }
      const blend=accumulator/fixedStep;
      for(const body of bodies){
        const element=elements.current.get(body.id);
        const x=body.previousX+(body.x-body.previousX)*blend,y=body.previousY+(body.y-body.previousY)*blend;
        if(element){element.style.width=`${body.size}px`;element.style.transform=`translate3d(${x-body.size/2}px,${y-body.size/2}px,0)`;element.dataset.labelAbove=String(y+body.radius+20>height);}
      }
      frame=requestAnimationFrame(draw);
    }
    frame=requestAnimationFrame(draw);return()=>cancelAnimationFrame(frame);
  },[]);
  return <section className="flower-field" aria-label="大家的花" data-count={flowers.length}>{flowers.map(flower=><div key={flower.id} ref={element=>{if(element)elements.current.set(flower.id,element);else elements.current.delete(flower.id);}} className="wall-flower" style={{'--arrival-delay':`${(flower.sequence%6)*.055}s`}} data-flower-id={flower.id}><FlowerImage flower={flower} assets={assets} projection onLoad={event=>{const edges=visibleEdges(event.currentTarget);imageBounds.current.set(flower.id,edges);const body=world.current.bodies.find(item=>item.id===flower.id);if(body)body.edges=edges;}}/>{flower.name&&<span>{flower.name}</span>}</div>)}</section>;
}
export default function Wall(){
  const [flowers,setFlowers]=useState([]),[assets,setAssets]=useState(null),[failed,setFailed]=useState(false);
  const [connection,setConnection]=useState('connecting');
  const [layout,setLayout]=useState({width:innerWidth,height:innerHeight});
  const shell=useRef(null);
  const qr=useMemo(()=>{const code=qrcode(0,'M');code.addData((['localhost','127.0.0.1'].includes(location.hostname)?PUBLIC_EVENT_URL:location.origin)+'/?v=nature1102');code.make();return code.createSvgTag({cellSize:3,margin:12,scalable:true}).replace(/fill="white"/g,'fill="none"').replace(/fill="black"/g,'fill="#ffffff"');},[]);
  useEffect(()=>{
    const element=shell.current;
    function measure(){
      const bounds=element.getBoundingClientRect();
      setLayout({width:bounds.width,height:bounds.height});
    }
    const observer=new ResizeObserver(measure);observer.observe(element);
    return()=>observer.disconnect();
  },[]);
  useEffect(()=>{
    const controller=new AbortController();
    fetch('/assets/final1014/patterns.json',{signal:controller.signal}).then(response=>{if(!response.ok)throw Error();return response.json();}).then(setAssets).catch(error=>{if(error.name!=='AbortError')setFailed(true);});
    return()=>controller.abort();
  },[]);
  useEffect(()=>watchFlowers(setFlowers,setConnection),[]);
  useEffect(()=>{
    const key=event=>{if(event.key.toLowerCase()==='f'&&!event.ctrlKey&&!event.metaKey){const action=document.fullscreenElement?document.exitFullscreen():shell.current.requestFullscreen?.();action?.catch(()=>{});}};
    addEventListener('keydown',key);return()=>removeEventListener('keydown',key);
  },[]);
  const scale=layout.width/artwork.width;
  const top=Math.max(0,(layout.height-artwork.contentHeight*scale)/2)-artwork.y*scale;
  return <main ref={shell} className="wall-shell">
    <h1 className="wall-sr-only">澳門大學環澳琴設計周 2026 · 設計之源</h1>
    <div className="wall-crop"><div className="wall-composition" style={{width:8787.402*scale,height:3826.77*scale,left:-artwork.x*scale,top}}>
      <img className="wall-underlay" src="/assets/wall/wall-fixed-1107.png" alt="University of Macau Pan-Macau-Hengqin Design Week 2026 · 原稿投影主視覺"/>
      <img className="wall-rings" src="/assets/wall/wall-rings-1107.png" alt="" style={{height:3826.77*scale}}/>
      {wallOrbits.map((orbit,i)=><img key={orbit.src} className={`wall-small-orbit orbit-${i}`} src={orbit.src} alt="" style={{left:orbit.x*scale,top:orbit.y*scale,width:orbit.width*scale,height:orbit.height*scale}}/>)}
    </div></div>
    <FlowerField flowers={flowers} assets={assets} layout={layout}/>
    <aside className="wall-invitation"><div className="wall-qr" role="img" aria-label="扫描二维码制作花" dangerouslySetInnerHTML={{__html:qr}}/><p><span>掃碼，製作您的花</span><small lang="en">Scan to create your flower</small></p></aside>
    {failed&&<p className="wall-error" role="alert">暂时无法读取花，请刷新重试。</p>}
    {!failed&&connection==='reconnecting'&&<p className="wall-error" role="status">正在重新连接，已有花会继续飘动。</p>}
  </main>;
}

