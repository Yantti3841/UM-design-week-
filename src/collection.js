async function request(path,options={}){
  const response=await fetch(path,{cache:'no-store',signal:AbortSignal.timeout(15000),...options});
  if(!response.ok)throw Error(`Collection request failed (${response.status})`);
  return response.json();
}
export async function submitFlower(config,id){
  const result=await request('/api/flowers',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({submissionId:id,config})});
  if(!result.saved||!result.flower?.id)throw Error('Flower was not saved');
  return result.flower;
}
export async function listFlowers(){
  const flowers=[];let cursor=0;
  while(true){
    const result=await request(`/api/flowers?scope=archive&after=${cursor}&limit=100`);
    flowers.push(...result.flowers);cursor=result.cursor;
    if(result.flowers.length<100)return flowers;
  }
}
export function watchFlowers(onChange,onState=()=>{}){
  let socket,timer,retry,stopped=false,attempt=0,lastReply=0,cursor=null,revision=null,polling=false;
  const records=new Map();
  function receive(result){
    if(stopped)return;
    if(result.reset)records.clear();
    for(const flower of result.flowers)records.set(flower.id,flower);
    const ordered=[...records.values()].sort((a,b)=>a.sequence-b.sequence);
    for(const flower of ordered.slice(0,-60))records.delete(flower.id);
    cursor=result.reset?result.cursor:Math.max(cursor??0,result.cursor);revision=result.revision;lastReply=Date.now();onState('connected');
    if(result.reset||result.flowers.length||!ordered.length)onChange(ordered.slice(-60),{reset:result.reset,revision});
  }
  async function poll(){
    if(stopped||polling)return;polling=true;
    try{receive(await request('/api/flowers'));}catch{if(!stopped)onState('reconnecting');}
    finally{polling=false;}
  }
  function sync(){
    if(socket?.readyState===WebSocket.OPEN)socket.send(JSON.stringify({type:'sync',after:cursor,revision}));
  }
  function connect(){
    if(stopped)return;
    clearTimeout(retry);onState('connecting');
    socket=new WebSocket(import.meta.env.VITE_WALL_WS_URL||`${location.protocol==='https:'?'wss:':'ws:'}//${location.host}/api/wall`);
    const current=socket;
    current.onopen=()=>{attempt=0;cursor=null;lastReply=Date.now();sync();};
    current.onmessage=event=>{
      if(current!==socket||stopped)return;
      try{const result=JSON.parse(event.data);if(['snapshot','flowers'].includes(result.type)&&Array.isArray(result.flowers))receive(result);}catch{current.close();}
    };
    current.onerror=()=>current.close();
    current.onclose=()=>{
      if(stopped||current!==socket)return;
      onState('reconnecting');poll();
      retry=setTimeout(connect,Math.min(15000,1000*2**attempt++)+Math.random()*250);
    };
  }
  timer=setInterval(()=>{
    if(socket?.readyState===WebSocket.OPEN){if(Date.now()-lastReply>10000)socket.close();else sync();}
    else poll();
  },1500);
  const resume=()=>{if(!stopped){if(socket?.readyState===WebSocket.OPEN)sync();else{socket?.close();connect();}}};
  const visible=()=>{if(document.visibilityState==='visible')resume();};
  addEventListener('online',resume);document.addEventListener('visibilitychange',visible);
  poll();connect();
  return()=>{stopped=true;clearInterval(timer);clearTimeout(retry);socket?.close();removeEventListener('online',resume);document.removeEventListener('visibilitychange',visible);};
}
