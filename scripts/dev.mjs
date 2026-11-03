import { build } from 'esbuild';
import { createServer } from 'vite';
import { startRuntime } from './runtime.mjs';

const worker=await build({entryPoints:['worker/index.js'],bundle:true,write:false,format:'esm',platform:'browser',target:'es2022',define:{__STATIC_ASSETS__:'{}'}});
const mf=await startRuntime(worker.outputFiles[0].text,8787);
const server=await createServer({server:{host:'127.0.0.1',port:5173,strictPort:true,proxy:{'/api':{target:'http://127.0.0.1:8787',ws:true}}}});
await server.listen();server.printUrls();
console.log('Local test database only. Public event data is separate.');
async function stop(){await server.close();await mf.dispose();process.exit(0);}
process.on('SIGINT',stop);process.on('SIGTERM',stop);
