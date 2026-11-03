import { readFile } from 'node:fs/promises';
import { startRuntime } from './runtime.mjs';
import { PUBLIC_EVENT_URL } from '../src/event.js';
import { createServer } from 'node:http';

const local=process.env.UMDW_LOCAL_DATABASE==='1';
const port=Number(process.env.UMDW_PORT||4180);
let stop;
if(local){
  const mf=await startRuntime(await readFile('dist/server/index.js','utf8'),port);
  console.log(`UMDW: ${await mf.ready} — local test database`);
  stop=async()=>{await mf.dispose();process.exit(0);};
}else{
  const server=createServer((request,response)=>{
    if(request.url==='/health'){response.writeHead(200,{'Content-Type':'application/json','Cache-Control':'no-store'});response.end(JSON.stringify({ready:true}));return;}
    response.writeHead(302,{Location:PUBLIC_EVENT_URL+(request.url||'/'),'Cache-Control':'no-store'});response.end();
  });
  server.listen(port,'127.0.0.1',()=>console.log(`UMDW: http://127.0.0.1:${port}/ → ${PUBLIC_EVENT_URL} shared collection`));
  stop=()=>server.close(()=>process.exit(0));
}
process.on('SIGINT',stop);process.on('SIGTERM',stop);
