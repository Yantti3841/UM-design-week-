import { build as buildClient } from 'vite';
import { build as bundle } from 'esbuild';
import { readFile,mkdir,readdir,cp } from 'node:fs/promises';
import { extname,join,relative } from 'node:path';
import { gzipSync } from 'node:zlib';

await buildClient({build:{outDir:'dist/client'}});
const types={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.svg':'image/svg+xml','.json':'application/json; charset=utf-8','.png':'image/png','.ico':'image/x-icon','.jpg':'image/jpeg','.mp4':'video/mp4'};
const assets={};
async function collect(folder){
  for(const item of await readdir(folder,{withFileTypes:true})){
    const file=join(folder,item.name);
    if(item.isDirectory()){await collect(file);continue;}
    const bytes=await readFile(file),extension=extname(file),binary=!['.html','.js','.css','.svg','.json','.txt'].includes(extension);
    assets['/'+relative('dist/client',file).replaceAll('\\','/')]={type:types[extension]||'application/octet-stream',binary,data:bytes.toString(binary?'base64':'utf8')};
  }
}
await collect('dist/client');
await mkdir('dist/server',{recursive:true});
await bundle({entryPoints:[process.env.UMDW_TARGET==='cloudflare'?'worker/cloudflare.js':'worker/index.js'],bundle:true,minify:true,format:'esm',platform:'browser',target:'es2022',outfile:'dist/server/index.js',define:{__STATIC_ASSETS__:JSON.stringify(assets)}});
await mkdir('dist/.openai',{recursive:true});
await cp('.openai/hosting.json','dist/.openai/hosting.json');
await cp('drizzle','dist/.openai/drizzle',{recursive:true});
const compressed=gzipSync(await readFile('dist/server/index.js')).length;
if(compressed>3*1024*1024)throw Error('Worker exceeds 3 MB compressed');
console.log(`Shared flower wall Worker: ${(compressed/1024).toFixed(0)} KB compressed; ${Object.keys(assets).length} assets.`);
