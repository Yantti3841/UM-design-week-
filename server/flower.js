import { disciplines,approaches,experiences,roles,regions,affiliations,backgroundSchemes } from '../src/generator.js';
import assets from '../public/assets/final1014/patterns.json' with {type:'json'};
import { renderFlower as render } from '../src/flowerSvg.js';
export const renderFlower=(recipe,options)=>render(recipe,assets,options);

export const EVENT='umdw-2026';
export const GENERATOR_VERSION='nature1102-v2';
export function validateRecipe(value) {
  if(!value||typeof value!=='object'||Array.isArray(value))throw Error('Invalid flower');
  const recipe={};
  for(const [key,choices] of Object.entries({discipline:disciplines,approach:approaches,experience:experiences,role:roles,region:regions,affiliation:affiliations})){
    if(!choices.some(choice=>choice.id===value[key]))throw Error(`Invalid ${key}`);
    recipe[key]=value[key];
  }
  for(const [key,min,max,nullable] of [['palette',0,2,false],['paletteScheme',0,backgroundSchemes.length-1,true],['experienceLevel',0,100,true],['affiliationLevel',0,100,true],['speed',.5,2,false]]){
    const n=value[key];
    if(nullable&&n===null){recipe[key]=null;continue;}
    if(typeof n!=='number'||!Number.isFinite(n)||n<min||n>max||(['palette','paletteScheme'].includes(key)&&!Number.isInteger(n)))throw Error(`Invalid ${key}`);
    recipe[key]=n;
  }
  if(!['still','rotate','breathe'].includes(value.motion))throw Error('Invalid motion');
  if(![0,180].includes(value.fieldRotation))throw Error('Invalid orientation');
  if(typeof value.name!=='string'||value.name.length>20)throw Error('Name must be at most 20 characters');
  return {...recipe,motion:value.motion,fieldRotation:value.fieldRotation,name:value.name.replace(/[\u0000-\u001f\u007f]/g,'').trim()};
}
