import {mkdirSync,writeFileSync} from 'node:fs';
import qrcode from 'qrcode-generator';
import {renderFlower} from '../server/flower.js';
import {defaultConfig} from '../src/generator.js';
import {brandArtwork} from '../src/brandArtwork.js';
const destination='https://umdw2026.netlify.app/invite';
const ink='#1c2c26',surface='#e7e8eb';
const code=qrcode(0,'M');code.addData(destination);code.make();
const qr=code.createSvgTag({cellSize:8,margin:32,scalable:true}).replace('<svg ','<svg x="80" y="1090" width="330" height="330" ').replace(/fill="white"/g,`fill="${surface}"`).replace(/fill="black"/g,`fill="${ink}"`);
const flower=renderFlower({...defaultConfig,paletteScheme:0,palette:0,motion:'still'}).replace('width="1200" height="1200"','x="210" y="365" width="660" height="660"');
const brand=brandArtwork.replace('<svg ',`<svg fill="${ink}" x="80" y="1510" `).replace('width="1005" height="130"','width="920" height="119"').replace(/fill="#[a-fA-F0-9]+"/g,`fill="${ink}"`);
const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1680" viewBox="0 0 1080 1680"><rect width="1080" height="1680" fill="${surface}"/>
<g fill="${ink}" font-family="Arial,Microsoft YaHei,sans-serif">

<text x="80" y="150" font-size="66">設計之源，花期之約</text><text x="80" y="219" font-size="48">A Flower, An Invitation</text>
<text x="80" y="277" font-size="24">澳門大學環澳琴設計周 · 邀請卡製作</text>
<text x="80" y="311" font-size="21">University of Macau Pan-Macau-Hengqin Design Week</text>
</g>${flower}${qr}
<g fill="${ink}" font-family="Arial,Microsoft YaHei,sans-serif">
<text x="466" y="1140" font-size="34">掃碼，製作您的邀請卡</text>
<text x="466" y="1195" font-size="32">Scan to create</text><text x="466" y="1236" font-size="32">your invitation card.</text>
<text x="466" y="1300" font-size="24">留下您的經歷與設計角色，</text><text x="466" y="1340" font-size="24">生成一張專屬的設計周邀請卡。</text>
<text x="466" y="1389" font-size="21">Create a Design Week invitation</text><text x="466" y="1421" font-size="21">inspired by your story.</text>

</g>${brand}</svg>`;
mkdirSync('deliverables',{recursive:true});mkdirSync('.sites-runtime',{recursive:true});
writeFileSync('deliverables/UMDW-Invitation-Card-QR.svg',svg);
writeFileSync('.sites-runtime/generator-invitation.html',`<!doctype html><html><head><meta charset="utf-8"><style>html,body{margin:0;width:1080px;height:1680px;background:${surface}}body>svg{display:block}</style></head><body>${svg}</body></html>`);
console.log('Poster SVG created; QR destination: '+destination);
