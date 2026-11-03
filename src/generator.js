export const disciplines = [
  { id:'visual', zh:'視覺傳達設計', en:'Visual communication', pattern:2 },
  { id:'industrial', zh:'工業設計', en:'Industrial design', pattern:3 },
  { id:'architecture', zh:'建築及城市設計', en:'Architecture & urban design', pattern:4 },
  { id:'other', zh:'其他', en:'Other', pattern:5 },
];
export const affiliations = [
  { id:'academia', zh:'更接近學術界', en:'Closer to academia', pattern:31 },
  { id:'industry', zh:'更接近業界', en:'Closer to industry', pattern:32 },
];
export const experiences = [
  { id:'new', zh:'學生或新人 <2年', en:'Student / newcomer <2 years', pattern:28 },
  { id:'mid', zh:'中級從業者 2–10年', en:'Practitioner 2–10 years', pattern:29 },
  { id:'senior', zh:'資深專家 10年以上', en:'Expert 10+ years', pattern:30 },
];
export const roles = [
  { id:'none', zh:'暫不添加身份層', en:'No role layer', pattern:null },
  { id:'volunteer', zh:'志願者', en:'Volunteer', pattern:16 },
  { id:'faculty', zh:'澳大教師', en:'UM faculty', pattern:17 },
  { id:'guest', zh:'訪問嘉賓', en:'Visiting guest', pattern:18 },
  { id:'staff', zh:'團隊工作人員', en:'Team member', pattern:19 },
  { id:'audience', zh:'觀眾', en:'Audience', pattern:20 },
];
export const regions = [
  { id:'china', zh:'中國（內地及港澳台）', zhShort:'中國', enShort:'China', en:'China (mainland, HK, Macao & Taiwan)', pattern:21 },
  { id:'europe', zh:'歐洲', en:'Europe', pattern:22 },
  { id:'north-america', zh:'北美洲', en:'North America', enShort:'N. America', pattern:23 },
  { id:'south-america', zh:'南美洲', en:'South America', enShort:'S. America', pattern:24 },
  { id:'africa', zh:'非洲', en:'Africa', pattern:25 },
  { id:'asia', zh:'亞洲（中國外其他）', zhShort:'亞洲其他', en:'Asia (outside China)', enShort:'Asia (other)', pattern:26 },
  { id:'oceania', zh:'大洋洲', en:'Oceania', pattern:27 },
];
export const approaches = [
  { id:'specialist', zh:'專精', en:'Specialist', pattern:14 },
  { id:'interdisciplinary', zh:'跨學科', en:'Interdisciplinary', pattern:15 },
];
// Unique three-color combinations shown on source pages 6–13.
export const backgroundSchemes = [
  { page:6, zh:'青紅金', en:'Aqua & gold', colors:['#cef5f5','#7f1b1c'], palette:0 },
  { page:7, zh:'橄欖珊瑚', en:'Olive & coral', colors:['#5f6347','#ccd700'], palette:1 },
  { page:8, zh:'奶黃霧灰', en:'Cream & mist', colors:['#f1ec98','#0048ad'], palette:2 },
  { page:9, zh:'森綠金', en:'Forest & gold', colors:['#0e771f','#d6d0d4'], palette:0 },
  { page:10, zh:'藍黃珊瑚', en:'Blue & coral', colors:['#0048ad','#f1ec98'], palette:1 },
  { page:11, zh:'森綠霧灰', en:'Forest & mist', colors:['#0e771f','#d6d0d4'], palette:2 },
];
export const palettes = [
  { zh:'金黃', en:'Gold', color:'#eec102' },
  { zh:'珊瑚橙', en:'Coral', color:'#fe502e' },
  { zh:'霧灰', en:'Mist', color:'#8ea0a5' },
];
// Values recovered from the labelled source and matched against preset vector paths.
export const presets = [
  { page:33, discipline:'visual', affiliation:'academia', region:'china', experience:'new', role:'faculty', approach:'interdisciplinary', palette:2 },
  { page:34, discipline:'other', affiliation:'academia', region:'china', experience:'mid', role:'staff', approach:'interdisciplinary', palette:1 },
  { page:35, discipline:'architecture', affiliation:'academia', region:'china', experience:'senior', role:'faculty', approach:'specialist', palette:2 },
  { page:36, discipline:'visual', affiliation:'industry', region:'north-america', experience:'mid', role:'none', approach:'interdisciplinary', palette:0 },
  { page:37, discipline:'architecture', affiliation:'academia', region:'oceania', experience:'senior', role:'guest', approach:'specialist', palette:2 },
  { page:38, discipline:'industrial', affiliation:'academia', region:'europe', experience:'mid', role:'faculty', approach:'specialist', palette:0 },
  { page:39, discipline:'other', affiliation:'academia', region:'asia', experience:'new', role:'audience', approach:'specialist', palette:1 },
  { page:40, discipline:'visual', affiliation:'industry', region:'africa', experience:'senior', role:'volunteer', approach:'specialist', palette:0, fieldRotation:180 },
];
export const defaultConfig = { ...presets[0], paletteScheme:null, experienceLevel:null, affiliationLevel:null, fieldRotation:0, name:'', motion:'rotate', speed:1 };
export const stepKeys = ['discipline','approach','experience','role','region','affiliation','paletteScheme'];
export const findChoice = (options, id) => options.find(option=>option.id===id);
export function derive(config) {
  const region = findChoice(regions,config.region).pattern;
  return [
    { key:'discipline', pattern:findChoice(disciplines,config.discipline).pattern, part:config.discipline==='visual' && config.fieldRotation===180 ? 'upright' : undefined, colors:backgroundSchemes[config.paletteScheme]?.colors },
    { key:'approach', pattern:findChoice(approaches,config.approach).pattern, color:config.palette===1 && config.approach==='interdisciplinary' ? null : palettes[config.palette].color },
    { key:'peach', pattern:1 },
    { key:'region-disk', pattern:region, part:'disk' },
    { key:'experience', pattern:findChoice(experiences,config.experience).pattern, progress:config.experienceLevel, animated:true },
    { key:'role', pattern:findChoice(roles,config.role).pattern, animated:true },
    { key:'region-nodes', pattern:region, part:'nodes', animated:true },
    { key:'affiliation', pattern:findChoice(affiliations,config.affiliation).pattern, progress:config.affiliationLevel, animated:true },
  ];
}
const svgNumber=/-?(?:\d*\.)?\d+(?:e[-+]?\d+)?/gi;
const paintedPath=/<path\b[^>]*\bfill="#[0-9a-fA-F]{6}"[^>]*>/g;
const attribute=(tag,name)=>tag.match(new RegExp(`\\b${name}="([^"]*)"`))[1];
const numbers=value=>value.match(svgNumber).map(Number);
function interpolateNumbers(template,from,to,amount) {
  let index=0;
  return template.replace(svgNumber,()=>{const i=index++;return ` ${Number((from[i]+(to[i]-from[i])*amount).toFixed(4))} `;});
}
function spikeNumbers(path) {
  const data=attribute(path,'d');
  const values=numbers(data);
  if(data.includes('C'))return values;
  // Represent each sharp vertex as a zero-length cubic, matching the rounded middle preset.
  const result=values.slice(0,2);
  for(let i=2;i<=values.length;i+=2) {
    const vertex=values.slice(i%values.length,i%values.length+2);
    for(let j=0;j<4;j++)result.push(...vertex);
  }
  return result;
}
function ringAngle(path) {
  const coords=numbers(attribute(path,'d'));
  const xs=coords.filter((_,i)=>i%2===0),ys=coords.filter((_,i)=>i%2===1);
  const matrix=numbers(attribute(path,'transform'));
  return Math.atan2(matrix[5]-(Math.min(...ys)+Math.max(...ys))/2-350,matrix[4]+(Math.min(...xs)+Math.max(...xs))/2-350);
}
export function interpolatePattern(assets,key,progress) {
  const value=progress/100;
  const ids=key==='experience'?[28,29,30]:[31,32];
  const position=value*(ids.length-1);
  if(Number.isInteger(position))return assets[ids[position]-1];
  const segment=Math.floor(position),amount=position-segment;
  const from=[...assets[ids[segment]-1].svg.matchAll(paintedPath)].map(m=>m[0]);
  const to=[...assets[ids[segment+1]-1].svg.matchAll(paintedPath)].map(m=>m[0]);
  const template=assets[key==='experience'?28:30];
  if(key==='affiliation'){from.sort((a,b)=>ringAngle(a)-ringAngle(b));to.sort((a,b)=>ringAngle(a)-ringAngle(b));}
  let index=0;
  const svg=template.svg.replace(paintedPath,tag=>{
    const i=index++,left=from[i],right=to[i];
    if(key==='affiliation')tag=left;
    for(const name of ['d','transform']) {
      const a=key==='experience'&&name==='d'?spikeNumbers(left):numbers(attribute(left,name));
      const b=key==='experience'&&name==='d'?spikeNumbers(right):numbers(attribute(right,name));
      const result=interpolateNumbers(attribute(tag,name),a,b,amount);
      tag=tag.replace(new RegExp(`\\b${name}="[^"]*"`),`${name}="${result}"`);
    }
    return tag;
  });
  return {...template,svg};
}
export function patternMarkup(pattern, prefix, color, part, colors) {
  let svg=part ? pattern[part] : pattern.svg;
  for(const id of [...svg.matchAll(/id="([^"]+)"/g)].map(m=>m[1]).sort((a,b)=>b.length-a.length)) {
    svg=svg.replaceAll(`id="${id}"`,`id="${prefix}-${id}"`).replaceAll(`#${id})`,`#${prefix}-${id})`).replaceAll(`"#${id}"`,`"#${prefix}-${id}"`);
  }
  if(colors) {
    const original=[...new Set([...svg.matchAll(/fill="(#[0-9a-fA-F]{6})"/g)].map(m=>m[1]))];
    svg=svg.replace(/fill="(#[0-9a-fA-F]{6})"/g,(match,fill)=>original.indexOf(fill)<2?`fill="${colors[original.indexOf(fill)]}"`:match);
  }
  if(color) svg=svg.replace(/fill="#[0-9a-fA-F]{6}"/g,`fill="${color}"`);
  return svg.replace(/^<svg[^>]*>/,'').replace(/<\/svg>\s*$/,'');
}
