import { derive,interpolatePattern,patternMarkup } from './generator.js';

export function renderFlower(recipe,assets,{projection=false,animate=false,squareFrame=false,squareBackground=null,answers=null}={}){
  const layers=derive(recipe).filter(layer=>layer.pattern&&(!projection||!['discipline','approach'].includes(layer.key))&&(!answers||layer.key==='peach'||answers.includes(layer.key)||(layer.key.startsWith('region-')&&answers.includes('region'))));
  const content=layers.map(layer=>{
    const pattern=layer.progress==null?assets[layer.pattern-1]:interpolatePattern(assets,layer.key,layer.progress);
    const colors=layer.key==='discipline'&&squareBackground&&layer.colors?[squareBackground,layer.colors[1]]:layer.colors;
    const markup=patternMarkup(pattern,`flower-${layer.key}`,layer.color,layer.part,colors);
    let drawing=`<svg width="700" height="700" viewBox="0 0 700 700">${markup}</svg>`;
    if(animate&&layer.animated&&recipe.motion!=='still'){
      const index=['experience','role','region-nodes','affiliation'].indexOf(layer.key);
      const direction=index>1?-1:1,duration=(150+index*44)/recipe.speed;
      const motion=recipe.motion==='rotate'?`<animateTransform attributeName="transform" type="rotate" from="0 350 350" to="${360*direction} 350 350" dur="${duration}s" repeatCount="indefinite"/>`:`<animateTransform attributeName="transform" type="scale" values="1;1.018;1" dur="${7/recipe.speed}s" repeatCount="indefinite"/>`;
      drawing=recipe.motion==='rotate'?`<g>${motion}${drawing}</g>`:`<g transform="translate(350 350)"><g>${motion}<g transform="translate(-350 -350)">${drawing}</g></g></g>`;
    }
    return `<g data-layer="${layer.key}">${drawing}</g>`;
  }).join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="1200" viewBox="-10 -10 720 720">${content}${squareFrame&&!projection&&layers.some(layer=>layer.key==='discipline')?`<rect x="0" y="0" width="700" height="700" fill="none" stroke="${[1,3,4,5].includes(recipe.paletteScheme)?'#ffffff':'#182a25'}" stroke-opacity=".32" stroke-width="1.5"/>`:''}</svg>`;
}
