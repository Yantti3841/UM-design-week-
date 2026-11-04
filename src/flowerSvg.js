import { derive,interpolatePattern,patternMarkup,backgroundSchemes } from './generator.js';

export function renderFlower(recipe,assets,{projection=false,animate=false,squareBackground=null,answers=null}={}){
  const base=backgroundSchemes[recipe.paletteScheme]?.colors[0];
  const squareFill=squareBackground||(base?'#'+base.slice(1).match(/../g).map(hex=>{const n=parseInt(hex,16);return Math.round(['#5f6347','#0e771f','#0048ad'].includes(base)?n+(255-n)*.2:n*.84).toString(16).padStart(2,'0');}).join(''):null);
  const layers=derive(recipe).filter(layer=>layer.pattern&&(!projection||!['discipline','approach'].includes(layer.key))&&(!answers||layer.key==='peach'||answers.includes(layer.key)||(layer.key.startsWith('region-')&&answers.includes('region'))));
  const content=layers.map(layer=>{
    const pattern=layer.progress==null?assets[layer.pattern-1]:interpolatePattern(assets,layer.key,layer.progress);
    const colors=layer.key==='discipline'&&squareFill&&layer.colors?[squareFill,layer.colors[1]]:layer.colors;
    let markup=patternMarkup(pattern,`flower-${layer.key}`,layer.color,layer.part,colors);
    if(layer.key==='discipline'){
      const fill=squareFill||layer.colors?.[0]||pattern.svg.match(/fill="(#[0-9a-fA-F]{6})"/)?.[1];
      markup=`<rect data-field-background="square" x="0" y="0" width="700" height="700" fill="${fill}"/>${markup}`;
    }
    let drawing=`<svg width="700" height="700" viewBox="0 0 700 700">${markup}</svg>`;
    if(animate&&layer.animated&&recipe.motion!=='still'){
      const index=['experience','role','region-nodes','affiliation'].indexOf(layer.key);
      const direction=index>1?-1:1,duration=(150+index*44)/recipe.speed;
      const motion=recipe.motion==='rotate'?`<animateTransform attributeName="transform" type="rotate" from="0 350 350" to="${360*direction} 350 350" dur="${duration}s" repeatCount="indefinite"/>`:`<animateTransform attributeName="transform" type="scale" values="1;1.018;1" dur="${7/recipe.speed}s" repeatCount="indefinite"/>`;
      drawing=recipe.motion==='rotate'?`<g>${motion}${drawing}</g>`:`<g transform="translate(350 350)"><g>${motion}<g transform="translate(-350 -350)">${drawing}</g></g></g>`;
    }
    return `<g data-layer="${layer.key}">${drawing}</g>`;
  }).join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="1200" viewBox="-10 -10 720 720">${content}</svg>`;
}
