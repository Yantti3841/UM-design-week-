import { Miniflare } from 'miniflare';
import { mkdir,readdir,readFile,writeFile } from 'node:fs/promises';
import { join } from 'node:path';

export async function startRuntime(script,port){
  const state=process.env.UMDW_LOCAL_STATE||'.sites-runtime/shared-wall';
  await mkdir(state,{recursive:true});
  const mf=new Miniflare({modules:true,script,compatibilityDate:'2026-07-01',host:'127.0.0.1',port,cf:false,d1Databases:{DB:'umdw-2026'},d1Persist:join(state,'d1'),bindings:{ADMIN_EMAIL:process.env.UMDW_ADMIN_EMAIL||''}});
  await mf.ready;
  {
    const db=await mf.getD1Database('DB'),journal=join(state,'migrations.json');let applied=[];
    try{applied=JSON.parse(await readFile(journal,'utf8'));}catch(error){if(error.code!=='ENOENT')throw error;}
    for(const name of (await readdir('drizzle')).filter(name=>name.endsWith('.sql')).sort()){
      if(applied.includes(name))continue;
      const statements=(await readFile('drizzle/'+name,'utf8')).split('--> statement-breakpoint').map(sql=>sql.trim()).filter(Boolean);
      await db.batch(statements.map(sql=>db.prepare(sql)));applied.push(name);
      await writeFile(journal,JSON.stringify(applied));
    }
  }
  return mf;
}
