import qrcode from 'qrcode-generator';
import { renderFlower } from './flowerSvg';
import { PUBLIC_EVENT_URL } from './event';
import {brandArtwork} from './brandArtwork';
import { cardThemes,natureCopy } from './natureCopy';
const origin=typeof location!=='undefined'&&!['localhost','127.0.0.1'].includes(location.hostname)?location.origin:PUBLIC_EVENT_URL;
export const invitationURL=`${origin}/`;
export function invitationQR({dark='#000000',light='#ffffff'}={}){const code=qrcode(0,'M');code.addData(invitationURL);code.make();return code.createSvgTag({cellSize:4,margin:16,scalable:true}).replace(/fill="white"/g,`fill="${light}"`).replace(/fill="black"/g,`fill="${dark}"`);}
const escape=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[c]));
export function invitationSVG(config,assets,lang){
 const t=natureCopy[lang],theme=cardThemes[config.paletteScheme??2];
 const flower=renderFlower({...config,motion:'still'},assets).replace('width="1200" height="1200"','x="-15" y="-15" width="1110" height="1110"');
 const name=config.name.trim()||t.someone;
 const nameSize=Math.min(30,Math.floor(900/[...name].reduce((sum,c)=>sum+(/[\u0000-\u00ff]/.test(c)?.57:1),0)));
 const logo=brandArtwork.replace('<svg ',`<svg fill="${theme.ink}" x="70" y="1535" `).replace('width="1005" height="130"','width="940" height="122"').replace(/fill="#[a-fA-F0-9]+"/g,`fill="${theme.ink}"`);
 const qr=invitationQR({dark:theme.ink,light:'none'}).replace('<svg ','<svg x="838" y="1285" width="172" height="172" ');
 return `<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1680" viewBox="0 0 1080 1680"><rect width="1080" height="1680" fill="${theme.color}"/>
 ${flower}
 <g fill="${theme.ink}" font-family="Arial,Microsoft YaHei,sans-serif">
 <text x="70" y="1135" font-size="${nameSize}">${config.name.trim()?escape(name)+(lang==='zh'?'，':' — '):''}${lang==='zh'?'誠邀您蒞臨':'You are cordially invited'}</text>
 <text x="70" y="1205" font-size="${lang==='zh'?48:43}" font-family="Georgia,Songti SC,SimSun,serif">${lang==='zh'?'設計之源，花期之約':'A Flower, An Invitation'}</text>
 <text x="70" y="1257" font-size="${lang==='zh'?27:22}">${lang==='zh'?'二〇二六澳門大學環澳琴設計周':t.event+' 2026'}</text>
 <text x="70" y="1337" font-size="31">${lang==='zh'?'2026.10.26 — 11.17':'26 October — 17 November 2026'}</text>
 <text x="70" y="1400" font-size="${lang==='zh'?27:23}">${lang==='zh'?'澳琴國際教育（大學）城第一期':'Macao-Hengqin International Education'}</text>
 <text x="70" y="1440" font-size="${lang==='zh'?27:23}">${lang==='zh'?'澳門大學設計學院':'(University) Town, Phase 1'}</text>
 ${lang==='en'?'<text x="70" y="1480" font-size="23">Faculty of Design, University of Macau</text>':''}
 <text x="924" y="1485" text-anchor="middle" font-size="${lang==='zh'?20:17}">${lang==='zh'?'掃碼生成屬於我的花':'Scan to create your own flower'}</text>
 </g>${qr}${logo}</svg>`;
}
