import { BALANCE, CARD_TYPES, CONSUMABLES, RESOURCES } from './data.js?v=0.2.8';
import { clamp, pick, round } from './random.js?v=0.2.8';
export const gaugeNames={bodyST:'体ST',headST:'頭ST',bodyHP:'体HP',headHP:'頭HP'};
export const categoryNames={food:'食事 · 体ST',water:'飲み物 · 頭ST',bandage:'包帯 · 体HP',med:'医療箱 · 頭HP'};
export const resourceWeight=key=>RESOURCES[key]?.carry??.15;
export const itemPlan=entry=>entry&&typeof entry==='object'&&!Array.isArray(entry)&&Object.keys(entry).length===1&&Object.hasOwn(entry,'item')&&typeof entry.item==='string'&&Object.hasOwn(CONSUMABLES,entry.item);
export const reservedItems=(b,key)=>b.resolved?0:b.plan.filter(entry=>itemPlan(entry)&&entry.item===key).length;
export function consumableCard(key) {
  if(!Object.hasOwn(CONSUMABLES,key))return null;const def=CONSUMABLES[key];
  const effects=[{target:def.target,amount:def.amount},...(def.effects||[])];
  return {name:`${def.name}を使う`,kind:'recover',icon:def.icon,color:def.target.endsWith('ST')?'teal':'blue',bodyCost:0,headCost:0,consumable:key,desc:consumableDescription(key),bodyRecovery:effects.filter(x=>x.target==='bodyST').reduce((n,x)=>n+x.amount,0),headRecovery:effects.filter(x=>x.target==='headST').reduce((n,x)=>n+x.amount,0)};
}
export const combatAction=key=>typeof key==='string'&&key.startsWith('supply:')?consumableCard(key.slice(7)):CARD_TYPES[key];
const recoverEffects=d=>[{target:d.target,amount:d.amount},...(d.effects||[])];
export function consumableDescription(key) {
  const d=CONSUMABLES[key];if(!d)return '';
  const parts=recoverEffects(d).map(x=>`${gaugeNames[x.target]}＋${x.amount}`);
  if(d.buff)parts.push(`${d.buff.scope==='battle'?'次の戦闘':'次の探索'}：${{perception:'知覚',judgment:'判断',action:'行動',execution:'実効'}[d.buff.stat]}＋${d.buff.amount}`);
  if(d.hunger)parts.push(`空腹−${d.hunger}`);
  if(d.thirst)parts.push(`渇き${d.thirst>0?'−':'＋'}${Math.abs(d.thirst)}`);
  return parts.join(' / ');
}
export function applyConsumable(state,actor,key) {
  const d=CONSUMABLES[key],recoveries=[];
  for(const effect of recoverEffects(d)){
    const before=actor[effect.target];
    actor[effect.target]=round(clamp(before+effect.amount,0,actor.max?.[effect.target]??BALANCE.player[effect.target]));
    recoveries.push({target:effect.target,amount:round(actor[effect.target]-before)});
  }
  state.hunger=clamp(state.hunger-(d.hunger||0),0,100);state.thirst=clamp(state.thirst-(d.thirst||0),0,100);
  if(d.buff){
    state.boosts||={exploration:{},battle:{}};
    const scope=state.boosts[d.buff.scope]||(state.boosts[d.buff.scope]={});
    scope[d.buff.stat]=(scope[d.buff.stat]||0)+d.buff.amount;
  }
  const primary=recoveries[0]||{target:d.target,amount:0};
  return {...primary,recoveries,buff:d.buff||null,summary:recoveries.map(r=>`${gaugeNames[r.target]}＋${r.amount}`).join(' / ')};
}
export function queueBattleItem(state,key) {
  const b=state.combat;
  if(!b||b.resolved||b.result||b.player.headHP<=0)return '行動を選んでいる戦闘中に使えます。';
  if(!Object.hasOwn(CONSUMABLES,key))return '回復アイテムが見つかりません。';
  if(b.plan.length>=b.limits.action)return '行動上限です。予定を1つ外してください。';
  if((state.pack[key]||0)<=reservedItems(b,key))return '携行している未予約のアイテムがありません。';
  b.plan.push({item:key});return null;
}
export function lootResource(state,key,good) {
  const categories={food:'food',water:'water',med:['bandage','med']};
  if(!categories[key])return key;
  const category=categories[key],candidates=Object.keys(CONSUMABLES).filter(k=>Array.isArray(category)?category.includes(CONSUMABLES[k].category):CONSUMABLES[k].category===category);
  // Strong finds favor the substantial supplies, ordinary finds retain all variants.
  const preferred=candidates.filter(k=>CONSUMABLES[k].amount>=(key==='food'?7:key==='water'?7:5));
  return pick(state,good&&preferred.length?preferred:[key,key,...candidates]);
}
export function availableGroup(state,category,home=false) {
  return Object.entries(CONSUMABLES).filter(([,d])=>d.category===category).reduce((sum,[key])=>sum+(state.pack[key]||0)+(home?(state.baseResources[key]||0):0),0);
}
export function spendGroup(state,category,home=false) {
  const keys=Object.keys(CONSUMABLES).filter(key=>CONSUMABLES[key].category===category);
  const key=keys.find(key=>state.pack[key]>0)|| (home?keys.find(key=>state.baseResources[key]>0):null);
  if(!key)return false;
  if(state.pack[key]>0)state.pack[key]--;else state.baseResources[key]--;return true;
}
