import { handleApi } from '../server/api.js';

const assets=__STATIC_ASSETS__;
export default {
  async fetch(request,env){
    const url=new URL(request.url);
    if(url.pathname.startsWith('/api/')){
      try{return await handleApi(request,env);}catch(error){console.error('Flower collection:',error.message);return Response.json({error:'Please try again in a moment'},{status:503,headers:{'Cache-Control':'no-store'}});}
    }
    if(!['GET','HEAD'].includes(request.method))return new Response('Method not allowed',{status:405});
    const pathname=url.pathname.replace(/\/$/,'')||'/';
    if(pathname==='/invite'&&url.searchParams.get('v')==='nature1102')return new Response(null,{status:302,headers:{Location:new URL('/',url).href,'Cache-Control':'no-store'}});
    const path=['/','/invite','/wall','/archive','/admin','/scan','/links','/frontend-v15'].includes(pathname)?(pathname==='/frontend-v15'?'/frontend-v15/index.html':'/index.html'):url.pathname;
    const asset=assets[path];
    if(!asset)return new Response('Not found',{status:404});
    let bytes=asset.binary?Uint8Array.from(atob(asset.data),c=>c.charCodeAt(0)):asset.data;
    const headers={'Content-Type':asset.type,'Cache-Control':pathname==='/admin'?'private, no-store':path.endsWith('.html')?'no-cache':'public, max-age=86400','X-Content-Type-Options':'nosniff',...(pathname==='/admin'?{'Content-Security-Policy':"frame-ancestors 'self'",'X-Frame-Options':'SAMEORIGIN'}:{})};
    if(asset.type==='video/mp4'){
      const length=bytes.length;headers['Accept-Ranges']='bytes';headers['Content-Length']=String(length);
      const range=request.headers.get('Range');
      if(range){
        const match=/^bytes=(\d*)-(\d*)$/.exec(range);
        const start=match?.[1]?Number(match[1]):match?.[2]?Math.max(0,length-Number(match[2])):NaN;
        const end=match?.[1]&&match[2]?Math.min(Number(match[2]),length-1):length-1;
        if(!Number.isSafeInteger(start)||start>=length||end<start)return new Response(null,{status:416,headers:{'Content-Range':`bytes */${length}`}});
        headers['Content-Range']=`bytes ${start}-${end}/${length}`;headers['Content-Length']=String(end-start+1);
        return new Response(request.method==='HEAD'?null:bytes.slice(start,end+1),{status:206,headers});
      }
    }
    return new Response(request.method==='HEAD'?null:bytes,{headers});
  },
};
