function randomFor(id){
  let seed=[...id].reduce((value,char)=>Math.imul(value,31)+char.charCodeAt(0),7);
  return()=>{seed=(Math.imul(seed,1664525)+1013904223)|0;return (seed>>>0)/4294967296;};
}
export function makeBody(id,width,height,count,bodies){
  const next=randomFor(id);
  const size=Math.max(28,Math.min(width*.065,height*.13,Math.sqrt(width*height/Math.max(24,count))*.38))*(.58+next()*.6)*.72;
  const radius=size*.5+3;
  let point={x:width/2,y:height/2},score=-Infinity;
  for(let i=0;i<180;i++){
    const x=radius+next()*Math.max(0,width-radius*2),y=radius+next()*Math.max(0,height-radius*2);
    const gap=Math.min(...bodies.map(body=>Math.hypot(x-body.x,y-body.y)-radius-body.radius));
    if(gap>score){score=gap;point={x,y};}
    if(gap>radius*.6)break;
  }
  const heading=next()*Math.PI*2,speed=24+next()*12;
  return {id,...point,size,radius,vx:Math.cos(heading)*speed,vy:Math.sin(heading)*speed,cruiseSpeed:speed,phase:next()*Math.PI*2};
}
function reflect(body,nx,ny){
  const velocity=body.vx*nx+body.vy*ny;
  if(velocity<0){body.vx-=1.9*velocity*nx;body.vy-=1.9*velocity*ny;}
}
function constrain(body,width,height){
  const r=body.radius;
  const left=body.edges?body.edges.left*body.size:r,right=body.edges?body.edges.right*body.size:r,top=body.edges?body.edges.top*body.size:r,bottom=body.edges?body.edges.bottom*body.size:r;
  if(body.x<left){body.x=left+(left-body.x)*.9;reflect(body,1,0);}
  if(body.x>width-right){body.x=width-right-(body.x-width+right)*.9;reflect(body,-1,0);}
  if(body.y<top){body.y=top+(top-body.y)*.9;reflect(body,0,1);}
  if(body.y>height-bottom){body.y=height-bottom-(body.y-height+bottom)*.9;reflect(body,0,-1);}
}
export function advanceWorld(bodies,elapsed,width,height){
  const steps=Math.ceil(Math.min(elapsed,.05)*120),dt=Math.min(elapsed,.05)/Math.max(1,steps);
  for(let step=0;step<steps;step++){
    for(const body of bodies){
      const speed=Math.hypot(body.vx,body.vy);
      if(speed>.1){
        const recovery=1+((body.cruiseSpeed??30)/speed-1)*(1-Math.exp(-dt/6));
        body.vx*=recovery;body.vy*=recovery;
      }else{body.vx+=Math.cos(body.phase)*4*dt;body.vy+=Math.sin(body.phase)*4*dt;}
      body.x+=body.vx*dt;body.y+=body.vy*dt;
    }
    // Resolve contact several times so a cluster separates without passing through neighbours.
    for(let pass=0;pass<4;pass++){
      for(let i=0;i<bodies.length;i++)for(let j=i+1;j<bodies.length;j++){
        const a=bodies[i],b=bodies[j],dx=b.x-a.x,dy=b.y-a.y,distance=Math.hypot(dx,dy),contact=a.radius+b.radius;
        if(distance>=contact)continue;
        const nx=distance?dx/distance:1,ny=distance?dy/distance:0;
        const massA=1/(a.radius*a.radius),massB=1/(b.radius*b.radius),sum=massA+massB;
        const overlap=contact-distance+.01;
        a.x-=nx*overlap*massA/sum;a.y-=ny*overlap*massA/sum;b.x+=nx*overlap*massB/sum;b.y+=ny*overlap*massB/sum;
        const closing=(b.vx-a.vx)*nx+(b.vy-a.vy)*ny;
        if(closing<0){const impulse=-1.9*closing/sum;a.vx-=impulse*nx*massA;a.vy-=impulse*ny*massA;b.vx+=impulse*nx*massB;b.vy+=impulse*ny*massB;}
      }
      for(const body of bodies)constrain(body,width,height);
    }
  }
}
