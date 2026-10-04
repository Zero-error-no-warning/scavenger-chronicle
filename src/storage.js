import { BALANCE, CARD_TYPES, LOCATIONS, MODULES, WEAPONS, ARMOR, RESOURCES, MODIFIERS } from './data.js';
const KEY='scavenger-chronicle-save-v1';
const gaugeKeys=['headHP','bodyHP','headST','bodyST'];
const statKeys=['perception','judgment','action','execution'];
const num=(x,min=0,max=1e6)=>typeof x==='number'&&Number.isFinite(x)&&x>=min&&x<=max;
const arr=(x,max=1000)=>Array.isArray(x)&&x.length<=max;
const text=x=>typeof x==='string'&&x.length<1000;
const isId=(x,values)=>values.includes(x);
export function validateSave(s) {
  const fail=()=>{throw new Error('セーブデータの形式が違うか、壊れています。元のデータは上書きしていません。');};
  if(!s||s.version!==BALANCE.saveVersion)fail();
  for(const key of ['serial','day','region','visits','kills','lootCount'])if(!num(s[key]))fail();
  if(!num(s.rng,1,4294967295)||!Number.isInteger(s.rng)||!num(s.hour,0,23)||!num(s.location,0,14)||!Number.isInteger(s.location)||!num(s.baseLocation,0,14)||!Number.isInteger(s.baseLocation)||!num(s.hunger,0,100)||!num(s.thirst,0,100))fail();
  if(!s.vitals||gaugeKeys.some(k=>!num(s.vitals[k],0,BALANCE.player[k])))fail();
  for(const resources of [s.pack,s.baseResources])if(!resources||Object.keys(RESOURCES).some(k=>!num(resources[k])||!Number.isInteger(resources[k])))fail();
  if(!arr(s.modules,5)||s.modules.some(k=>!MODULES.some(m=>m.id===k))||new Set(s.modules).size!==s.modules.length)fail();
  const itemValid=item=>item&&text(item.id)&&text(item.name)&&text(item.visual)&&/^#[\da-f]{6}$/i.test(item.color)&&[...WEAPONS,...ARMOR].some(x=>x.id===item.baseId)&&isId(item.slot,['head','body','weapon'])&&num(item.carry,.1,50)&&num(item.weight,.1,50)&&num(item.sharpness,0,50)&&num(item.hardness,0,50)&&num(item.softness,1,50)&&arr(item.modifiers,10)&&new Set(item.modifiers).size===item.modifiers.length&&item.modifiers.every(k=>MODIFIERS.some(m=>m.id===k&&m.types.includes(item.type)))&&item.stats&&Object.entries(item.stats).every(([k,v])=>isId(k,statKeys)&&num(v,-20,20))&&(!item.cards||(arr(item.cards,10)&&item.cards.every(k=>!!CARD_TYPES[k])))&&(item.slot!=='weapon'||(num(item.minRange,0,6)&&num(item.maxRange,0,6)));
  if(!arr(s.inventory,100)||!arr(s.stash,16)||[...s.inventory,...s.stash].some(x=>!itemValid(x)))fail();
  if(new Set([...s.inventory,...s.stash].map(x=>x.id)).size!==s.inventory.length+s.stash.length)fail();
  if(!s.equipment||['head','body','weapon'].some(slot=>!s.inventory.some(x=>x.id===s.equipment[slot]&&x.slot===slot)))fail();
  if(!arr(s.world,15)||s.world.length!==15||s.world.some((node,i)=>node.id!==i||!LOCATIONS.some(x=>x.id===node.locId)||!num(node.visits)||typeof node.seen!=='boolean'||!arr(node.used,6)||node.used.some(x=>!Number.isInteger(x)||!num(x,0,5))))fail();
  if(!arr(s.log,80)||s.log.some(x=>!text(x.text)||!num(x.day)||!num(x.hour,0,23)))fail();
  if(s.exploration&&(!arr(s.exploration.spots,6)||s.exploration.spots.some(x=>!text(x.name)||!num(x.index,0,5)||!Number.isInteger(x.index))||!num(s.exploration.remaining,0,30)))fail();
  if(s.combat) {
    const b=s.combat;
    for(const actor of [b.player,b.enemy]) {
      if(!actor||!text(actor.name)||!text(actor.visual)||!actor.max||!actor.base||gaugeKeys.some(k=>!num(actor.max[k],1,1000)||!num(actor[k],0,actor.max[k]))||statKeys.some(k=>!num(actor.base[k],-20,30)))fail();
      if(!actor.weapon||!num(actor.weapon.sharpness,0,50)||!num(actor.weapon.weight,.1,50)||!num(actor.weapon.minRange,0,6)||!num(actor.weapon.maxRange,0,6))fail();
      if(!actor.armor||['head','body'].some(k=>!actor.armor[k]||!num(actor.armor[k].hardness,0,50)||!num(actor.armor[k].softness,1,50)))fail();
    }
    for(const key of ['hand','playerDeckSource','enemyDeckSource','playerDeck','enemyDeck','enemyPlan'])if(!arr(b[key],100)||b[key].some(k=>!CARD_TYPES[k]))fail();
    if(!arr(b.plan,30)||b.plan.some(x=>!Number.isInteger(x)||!num(x,0,b.hand.length-1))||new Set(b.plan).size!==b.plan.length||!num(b.distance,0,6)||!num(b.round,1,1e6)||!arr(b.history,60)||b.history.some(x=>!text(x))||!text(b.text)||!b.limits||statKeys.some(k=>!num(b.limits[k],0,30))||!isId(b.result,[null,'victory','defeat','mutual','escaped'])||typeof b.resolved!=='boolean')fail();
  }
  return s;
}
export function loadGame() {
  const raw=localStorage.getItem(KEY);
  return raw?validateSave(JSON.parse(raw)):null;
}
export function saveGame(s) {localStorage.setItem(KEY,JSON.stringify(s));}
export function parseSave(text) {if(text.length>2e6)throw new Error('セーブファイルが大きすぎます。');return validateSave(JSON.parse(text));}
