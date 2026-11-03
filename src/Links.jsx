import React,{useEffect} from 'react';
import {brandArtwork} from './brandArtwork';
import './entry.css';

const pages=[
 {url:'/',zh:'花朵生成器',en:'Flower generator',description:'製作您的花，送往投影大屏。'},
 {url:'/invite',zh:'邀請卡製作',en:'Invitation card',description:'生成並保存您的設計周邀請卡。'},
 {url:'/wall',zh:'投影大屏',en:'Live flower wall',description:'展示大家上傳的花，持續漂浮與互動。'},
 {url:'/scan',zh:'大二維碼展示頁',en:'Scan to create',description:'供現場展示、掃碼進入生成器。'},
 {url:'/archive',zh:'花朵作品集',en:'Flower collection',description:'瀏覽已收集的作品。'},
 {url:'/admin',zh:'管理後台',en:'Administration',description:'管理作品與回收站，需管理員登入。'},
];

export default function Links(){
 useEffect(()=>{document.title='所有頁面 · UMDW 2026';document.documentElement.lang='zh-Hant';},[]);
 return <main className="entry-page links-page">
  <header className="entry-brand" aria-label="University of Macau Pan-Macau-Hengqin Design Week 2026" dangerouslySetInnerHTML={{__html:brandArtwork}}/>
  <div className="links-layout">
   <div className="links-heading"><h1>所有頁面</h1><p lang="en">The Nature of Design</p><p>設計之源，花期之約</p></div>
   <nav className="links-list" aria-label="所有頁面 / All pages">{pages.map(page=><a key={page.url} href={page.url}><h2>{page.zh}<small lang="en">{page.en}</small></h2><p>{page.description}</p></a>)}</nav>
  </div>
 </main>;
}
