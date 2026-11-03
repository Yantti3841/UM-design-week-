import React,{useMemo} from 'react';
import { renderFlower } from './flowerSvg';

export default function FlowerImage({flower,assets,projection=false,alt,...props}){
  const animate=projection&&!matchMedia('(prefers-reduced-motion: reduce)').matches;
  const source=useMemo(()=>assets?'data:image/svg+xml;charset=utf-8,'+encodeURIComponent(renderFlower(flower.config,assets,{projection,animate})):undefined,[flower.config,assets,projection,animate]);
  return source?<img src={source} alt={alt||flower.name||`花 ${flower.number}`} {...props}/>:null;
}
