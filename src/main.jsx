import React from 'react';
import {createRoot} from 'react-dom/client';
import './style.css';
import './theme.css';

document.documentElement.dataset.theme='light';
const root=createRoot(document.getElementById('root'));
const route=location.pathname.replace(/\/$/,'');
const pages={'/wall':()=>import('./Wall'),'/archive':()=>import('./Archive'),'/admin':()=>import('./Admin'),'/scan':()=>import('./Scan'),'/links':()=>import('./Links')};
if(pages[route])pages[route]().then(({default:Page})=>root.render(<Page/>));
else Promise.all([fetch('/assets/final1014/patterns.json').then(r=>{if(!r.ok)throw Error('Pattern assets unavailable');return r.json();}),import('./Experience')]).then(([assets,{default:Experience}])=>root.render(<Experience assets={assets} invitation={route==='/invite'}/>)).catch(()=>{document.getElementById('root').textContent='圖案暫時無法載入，請刷新重試。 / Please refresh to load the artwork.';});
