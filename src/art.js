import { CONSUMABLES } from './data.js?v=0.2.8';
import { equipped } from './items.js?v=0.2.8';
export const escapeHTML = value => String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const e=escapeHTML;
// Interface symbols are typography; game illustration uses generated rasters.
const symbols={eye:'◎',brain:'◉',action:'ϟ',dice:'⚄',blade:'⚔',shield:'◈',advance:'→',retreat:'←',burst:'✦',stone:'◆',lung:'≈',exit:'↗',map:'▦',bag:'▱',gear:'⚙',food:'▤',water:'◒',cloth:'▥',fuel:'▣',medical:'✚',bed:'▰',book:'▧',sun:'☼',close:'×',plus:'+',check:'✓',head:'◉',body:'◈',save:'▣'};
export function icon(name,cls='') {
  const resources=['food','water','gear','cloth','fuel','medical'],i=resources.indexOf(name);
  if(i>=0)return atlas('resources',i%3,Math.floor(i/3),3,2,`icon resource-icon ${cls}`);
  return name==='van'?`<span class="icon painted-van-icon ${cls}" aria-hidden="true"></span>`:`<span class="icon symbol-icon ${cls}" aria-hidden="true">${symbols[name]||symbols.gear}</span>`;
}
export const locationKinds=['road','shop','clinic','factory','forest','apart','junk','river','tower'];
function atlas(file,col,row,cols,rows,cls='',label='',style='') {
  const x=cols>1?col/(cols-1)*100:0,y=rows>1?row/(rows-1)*100:0;
  return `<span class="painted-atlas ${cls}" ${label?`role="img" aria-label="${e(label)}"`:'aria-hidden="true"'} style="background-image:url('./assets/art/${file}.webp?v=${file==='exploration'?'0.2.0':'0.1.4'}');background-size:${cols*100}% ${rows*100}%;background-position:${x}% ${y}%;${style}"></span>`;
}
const weaponKinds=['broom','knife','pipe','axe','umbrella','shovel'];
export function weaponArt(item={visual:'broom'},{held=false}={}) {
  const index=Math.max(0,weaponKinds.indexOf(item.visual));
  // Measured grip positions keep a held tool attached while its size changes.
  const grips={broom:.39,knife:.73,pipe:.54,axe:.65,umbrella:.74,shovel:.45};
  const gripX={broom:.57,knife:.50,pipe:.56,axe:.61,umbrella:.50,shovel:.54};
  const sizes={broom:.65,knife:.42,pipe:.78,axe:.62,umbrella:.78,shovel:.70};
  const size=sizes[item.visual]||.8,long=item.modifiers?.includes('long')?1.12:1;
  const height=size*long*100,top=68-(grips[item.visual]||.5)*height;
  return atlas('weapons',index%3,Math.floor(index/3),3,2,held?'held-weapon':'item-art',held?'':item.name||'武器',held?`height:${height}%;width:${height}%;top:${top}%;left:${88-(gripX[item.visual]||.5)*height}%;`:'');
}
function outfitIndex(head,body) {
  const row=head?.visual==='helmet'?1:head?.visual==='goggles'?2:0;
  const col=body?.baseId==='raincoat'?3:body?.visual==='puffer'?1:body?.visual==='vest'?2:0;
  return {row,col};
}
export function character(state,{portrait=false}={}) {
  const head=equipped(state,'head'),body=equipped(state,'body'),weapon=equipped(state,'weapon');
  const {row,col}=outfitIndex(head,body);
  return `<span class="painted-character ${portrait?'portrait':''}" role="img" aria-label="${e([head?.name,body?.name,weapon?.name].filter(Boolean).join('・'))}を装備した主人公" data-head-art="${row}" data-body-art="${col}" data-weapon-art="${e(weapon?.visual||'broom')}">${atlas('player-outfits',col,row,4,3,'outfit')}${weaponArt(weapon,{held:true})}</span>`;
}
export function armorArt(item) {
  const {row,col}=outfitIndex(item.slot==='head'?item:null,item.slot==='body'?item:null);
  return `<span class="armor-art ${item.slot==='head'?'head-gear':'body-gear'}" role="img" aria-label="${e(item.name)}">${atlas('player-outfits',col,row,4,3,'armor-outfit')}</span>`;
}
export function enemyArt(type) {
  const index=type==='dog'?0:type==='robot'?2:1;
  return atlas('enemies',index,0,3,1,`painted-enemy ${type}`,type==='dog'?'野犬':type==='robot'?'保守ロボット':'敵の拾荒者');
}
export function vanArt(state) {
  return `<span class="painted-van" role="img" aria-label="移動拠点スズメ号、${state.modules.length}設備"><img src="./assets/art/van.webp?v=0.1.4" alt="" decoding="async">${state.modules.length?`<span class="van-upgrades" aria-hidden="true">${state.modules.map(id=>icon({bed:'bed',storage:'bag',filter:'water',workbench:'gear',engine:'action'}[id])).join('')}</span>`:''}</span>`;
}
export function landmarkArt(kind) {
  const i=Math.max(0,locationKinds.indexOf(kind));
  return atlas('landmarks',i%3,Math.floor(i/3),3,3,'landmark');
}
export function toolArt(item){const i=['crowbar','lockpick','rope'].indexOf(item.baseId);return atlas('exploration',Math.max(0,i),0,3,3,'item-art',item.name);}
export function spotArt(index){return atlas('exploration',index%3,Math.floor(index/3),3,3,'spot-illustration');}
export function cardArt(key) {
  const supply=key?.startsWith('supply:')?CONSUMABLES[key.slice(7)]:null;
  if(supply)return icon(supply.icon,'consumable-art');
  const tools={pry:0,unlock:1,rope:2,rummage:6,force:4};if(key in tools)return spotArt(tools[key]);
  const weapon={cut:'knife',dig:'shovel',sweep:'broom'}[key];if(weapon)return weaponArt({visual:weapon,name:''});
  const order=['advance','retreat','strike','heavy','throw','guard','breathe','focus','escape'];
  const i=Math.max(0,order.indexOf(key));
  return atlas('cards',i%3,Math.floor(i/3),3,3,'card-illustration');
}
export function scenery(state,kind='road',{combat=null,camp=false}={}) {
  const i=Math.max(0,locationKinds.indexOf(kind)),distance=combat?.distance??6;
  const playerLeft=combat?12+(6-distance)*3:camp?12:9,enemyRight=12+(6-distance)*3;
  const here=state.location===state.baseLocation;
  return `<div class="landscape painted-scene ${combat?'combat-art':''} ${camp?'camp-art':''} ${state.hour>=18||state.hour<6?'night-scene':''}" role="group" aria-label="${combat?'戦闘の場面':camp&&here?'移動拠点と主人公':'探索の場面'}"><span class="scene-backdrop">${atlas('backgrounds',i%3,Math.floor(i/3),3,3,'scene-background')}</span><span class="scene-shade" aria-hidden="true"></span>${combat?`<span class="scene-enemy" style="right:${enemyRight}%">${enemyArt(combat.enemy.visual)}</span>`:here?`<span class="scene-van">${vanArt(state)}</span>`:''}<span class="scene-player" style="left:${playerLeft}%">${character(state)}</span></div>`;
}
