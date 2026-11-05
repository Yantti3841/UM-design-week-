import {generatorTitle,invitationTitle} from '../../src/shareTitles.js';

function title(html,value){
 return html.replace(/<title>.*?<\/title>/,`<title>${value}</title>`)
  .replace(/(<meta property="og:title" content=")[^"]*/,`$1${value}`)
  .replace(/(<meta name="twitter:title" content=")[^"]*/,`$1${value}`);
}
export function shareTitles(){
 return {
  name:'bilingual-share-titles',
  transformIndexHtml:{order:'post',handler:(html,ctx)=>title(html,ctx.originalUrl?.split('?')[0].replace(/\/$/,'')==='/invite'?invitationTitle:generatorTitle)},
  generateBundle:{order:'post',handler(options,bundle){
   const page=bundle['index.html'];
   if(page?.type==='asset')this.emitFile({type:'asset',fileName:'invite.html',source:title(String(page.source),invitationTitle)});
  }},
 };
}
