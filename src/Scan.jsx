import React,{useEffect,useMemo} from 'react';
import qrcode from 'qrcode-generator';
import {brandArtwork} from './brandArtwork';
import {PUBLIC_EVENT_URL} from './event';
import './entry.css';

export default function Scan(){
 const url=(['localhost','127.0.0.1'].includes(location.hostname)?PUBLIC_EVENT_URL:location.origin)+'/';
 const qr=useMemo(()=>{const code=qrcode(0,'M');code.addData(url);code.make();return code.createSvgTag({cellSize:8,margin:32,scalable:true}).replace(/fill="white"/g,'fill="none"').replace(/fill="black"/g,'fill="#182a25"');},[url]);
 useEffect(()=>{document.title='掃碼製作您的花 · Scan to create your flower';document.documentElement.lang='zh-Hant';},[]);
 return <main className="entry-page scan-page">
  <div className="scan-layout">
   <a className="scan-code" href={url} aria-label="開啟花朵生成器 / Open the flower generator" dangerouslySetInnerHTML={{__html:qr}}/>
   <div className="scan-panel"><div className="scan-copy">
    <h1>掃描製作您的花</h1>
    <p className="scan-english" lang="en">Scan to create your flower</p>
    <div className="scan-credits"><p>指導老師：張一格<span lang="en">Faculty advisor: Eager Zhang</span></p><p>製作：陳彥霆、林嘉樂<span lang="en">Created by Chen Yanting &amp; Lin Jiale</span></p></div>
   </div>
  <footer className="entry-brand scan-brand" aria-label="University of Macau Pan-Macau-Hengqin Design Week 2026" dangerouslySetInnerHTML={{__html:brandArtwork}}/></div>
  </div>
 </main>;
}
